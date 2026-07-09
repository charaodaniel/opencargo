import { createClient } from "@supabase/supabase-js";
import { query, queryOne, uuid } from "../common/database.js";
import { config, isSupabaseAuth } from "../common/config.js";
import { getPagination, paginatedResponse } from "../common/pagination.js";
import { extname } from "path";

const STORAGE_BUCKET = "documents";
const SIGNED_URL_EXPIRY = 60 * 60; // 1 hora em segundos

const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".doc", ".docx", ".xls", ".xlsx", ".txt"];

const ENTITY_TYPES = ["company", "driver", "vehicle", "load", "general"];

let _supabase = null;

function getSupabase() {
  if (_supabase) return _supabase;
  _supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _supabase;
}

/**
 * Sobe arquivo para o Supabase Storage
 */
async function uploadToStorage(filePath, buffer, mimeType) {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) throw new Error(`Erro no upload Supabase: ${error.message}`);
  return data;
}

/**
 * Gera URL assinada para download
 */
async function getSignedUrl(filePath) {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(filePath, SIGNED_URL_EXPIRY);

  if (error) throw new Error(`Erro ao gerar URL: ${error.message}`);
  return data.signedUrl;
}

/**
 * Remove arquivo do Supabase Storage
 */
async function deleteFromStorage(filePath) {
  const supabase = getSupabase();
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([filePath]);

  if (error) {
    console.error("Erro ao remover do Supabase Storage:", error.message);
  }
}

export async function documentRoutes(app) {
  app.addHook("onRequest", app.authenticate);

  /**
   * POST /upload — Upload de arquivo para o Supabase Storage
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
    const storagePath = `${user.id}/${storedName}`;

    // Upload para o Supabase Storage
    if (isSupabaseAuth()) {
      await uploadToStorage(storagePath, buffer, data.mimetype || "application/octet-stream");
    }

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
   * GET /:id/download — Gera URL assinada para download
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

    const storagePath = `${doc.user_id}/${doc.stored_name}`;

    try {
      if (isSupabaseAuth()) {
        const signedUrl = await getSignedUrl(storagePath);
        return reply.send({
          downloadUrl: signedUrl,
          originalName: doc.original_name,
          mimeType: doc.mime_type,
        });
      } else {
        // Modo dev/test sem Supabase — retorna apenas metadados
        return reply.send({
          downloadUrl: null,
          originalName: doc.original_name,
          mimeType: doc.mime_type,
          message: "Download disponível apenas em produção com Supabase Storage",
        });
      }
    } catch (error) {
      return reply.status(500).send({ error: "Erro ao gerar link de download" });
    }
  });

  /**
   * DELETE /:id — Excluir documento (também do Storage)
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

    // Remove do Supabase Storage
    if (isSupabaseAuth()) {
      const storagePath = `${doc.user_id}/${doc.stored_name}`;
      await deleteFromStorage(storagePath);
    }

    // Remove registro do banco
    await query(`DELETE FROM documents WHERE id = ?`, [id]);

    return { success: true };
  });
}
