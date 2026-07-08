import { query, queryOne, uuid } from "../common/database.js";
import { config } from "../common/config.js";
import { getPagination, paginatedResponse } from "../common/pagination.js";
import { existsSync, mkdirSync, unlinkSync } from "fs";
import { writeFile } from "fs/promises";
import { join, extname } from "path";

const ALLOWED_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".doc", ".docx", ".xls", ".xlsx", ".txt"];

const ENTITY_TYPES = ["company", "driver", "vehicle", "load", "general"];

export async function documentRoutes(app) {
  app.addHook("onRequest", app.authenticate);

  /**
   * POST /upload — Upload de arquivo
   */
  app.post("/upload", async (request, reply) => {
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ error: "Nenhum arquivo enviado" });
    }

    const user = request.user;
    const entityType = data.fields.entityType?.value || "general";
    const entityId = data.fields.entityId?.value || null;

    // Valida entity_type
    if (!ENTITY_TYPES.includes(entityType)) {
      return reply.status(400).send({ error: "Tipo de entidade inválido" });
    }

    // Valida extensão
    const ext = extname(data.filename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return reply.status(400).send({
        error: `Tipo de arquivo não permitido: ${ext}. Permitidos: ${ALLOWED_EXTENSIONS.join(", ")}`,
      });
    }

    // Lê o arquivo em buffer
    const chunks = [];
    for await (const chunk of data.file) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Valida tamanho máximo
    if (buffer.length > config.MAX_FILE_SIZE) {
      return reply.status(400).send({
        error: `Arquivo muito grande. Máximo permitido: ${(config.MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB`,
      });
    }

    // Gera nome único para o arquivo
    const storedName = `${uuid()}${ext}`;

    // Cria diretório de upload se não existir
    const uploadDir = config.UPLOAD_DIR;
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // Salva o arquivo no disco
    const filePath = join(uploadDir, storedName);
    await writeFile(filePath, buffer);

    // Registra no banco
    const id = uuid();
    await query(
      `INSERT INTO documents (id, user_id, entity_type, entity_id, original_name, stored_name, mime_type, size_bytes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, user.id, entityType, entityId, data.filename, storedName, data.mimetype || "application/octet-stream", buffer.length]
    );

    const doc = await queryOne(`SELECT * FROM documents WHERE id = ?`, [id]);
    return reply.status(201).send(doc);
  });

  /**
   * GET / — Listar documentos do usuário
   */
  app.get("/", async (request) => {
    const user = request.user;
    const { entityType, entityId } = request.query;
    const { page, limit, offset } = getPagination(request.query);

    let whereSql = "WHERE user_id = ?";
    const params = [user.id];

    if (entityType) {
      whereSql += " AND entity_type = ?";
      params.push(entityType);
    }
    if (entityId) {
      whereSql += " AND entity_id = ?";
      params.push(entityId);
    }

    const [rows, [{ total }]] = await Promise.all([
      query(`SELECT * FROM documents ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]),
      query(`SELECT COUNT(*) as total FROM documents ${whereSql}`, params),
    ]);

    return paginatedResponse(rows, total, page, limit);
  });

  /**
   * GET /:id — Baixar arquivo
   */
  app.get("/:id/download", async (request, reply) => {
    const { id } = request.params;
    const user = request.user;

    const doc = await queryOne(`SELECT * FROM documents WHERE id = ?`, [id]);

    if (!doc) {
      return reply.status(404).send({ error: "Documento não encontrado" });
    }

    // Verifica se o documento pertence ao usuário
    if (doc.user_id !== user.id) {
      return reply.status(403).send({ error: "Acesso negado" });
    }

    const filePath = join(config.UPLOAD_DIR, doc.stored_name);

    if (!existsSync(filePath)) {
      return reply.status(404).send({ error: "Arquivo não encontrado no disco" });
    }

    return reply
      .header("Content-Disposition", `attachment; filename="${doc.original_name}"`)
      .header("Content-Type", doc.mime_type)
      .sendFile(doc.stored_name, config.UPLOAD_DIR);
  });

  /**
   * DELETE /:id — Excluir documento
   */
  app.delete("/:id", async (request, reply) => {
    const { id } = request.params;
    const user = request.user;

    const doc = await queryOne(`SELECT * FROM documents WHERE id = ?`, [id]);

    if (!doc) {
      return reply.status(404).send({ error: "Documento não encontrado" });
    }

    if (doc.user_id !== user.id) {
      return reply.status(403).send({ error: "Acesso negado" });
    }

    // Remove arquivo do disco
    const filePath = join(config.UPLOAD_DIR, doc.stored_name);
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch {
      // Ignora se arquivo não existe
    }

    // Remove registro do banco
    await query(`DELETE FROM documents WHERE id = ?`, [id]);

    return { success: true };
  });
}
