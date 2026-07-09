import { z } from "zod";
import { query, queryOne, uuid } from "../common/database.js";
import { getPagination, paginatedResponse } from "../common/pagination.js";

const createSchema = z.object({
  matchId: z.string().uuid(),
  loadId: z.string().uuid(),
  driverId: z.string().uuid(),
  companyId: z.string().uuid(),
  type: z.enum(["text", "pdf", "upload"]).default("text"),
  description: z.string().optional(),
  valueBrl: z.number().positive().optional(),
  pdfUrl: z.string().optional(),
  uploadedDocId: z.string().uuid().optional(),
});

const updateSchema = z.object({
  type: z.enum(["text", "pdf", "upload"]).optional(),
  status: z.enum(["pending", "signed", "completed", "cancelled"]).optional(),
  description: z.string().optional(),
  valueBrl: z.number().positive().optional(),
  pdfUrl: z.string().optional(),
  uploadedDocId: z.string().uuid().optional(),
});

/**
 * Gera número sequencial de OS: OS-YYYYMM-XXXXX
 */
async function generateOsNumber() {
  const now = new Date();
  const prefix = `OS-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-`;
  const last = await queryOne(
    `SELECT number FROM service_orders WHERE number LIKE ? ORDER BY created_at DESC LIMIT 1`,
    [`${prefix}%`]
  );
  const seq = last ? String(parseInt(last.number.split("-").pop(), 10) + 1).padStart(5, "0") : "00001";
  return `${prefix}${seq}`;
}

export async function serviceOrderRoutes(app) {
  app.addHook("onRequest", app.authenticate);

  /**
   * POST / — Criar ordem de serviço
   */
  app.post("/", async (request, reply) => {
    const body = createSchema.parse(request.body);
    const id = uuid();
    const number = await generateOsNumber();

    await query(
      `INSERT INTO service_orders (id, match_id, load_id, driver_id, company_id, type, number, description, value_brl, pdf_url, uploaded_doc_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [id, body.matchId, body.loadId, body.driverId, body.companyId, body.type, number,
       body.description || null, body.valueBrl || null, body.pdfUrl || null, body.uploadedDocId || null]
    );

    const os = await queryOne(`SELECT * FROM service_orders WHERE id = ?`, [id]);
    return reply.status(201).send(os);
  });

  /**
   * GET / — Listar ordens de serviço
   */
  app.get("/", async (request) => {
    const user = request.user;
    const { matchId, loadId, status } = request.query;
    const { page, limit, offset } = getPagination(request.query);

    const conditions = [];
    const params = [];

    // Filtra por papel do usuário
    if (user.role === "motorista") {
      conditions.push("so.driver_id = (SELECT id FROM drivers WHERE user_id = ?)");
      params.push(user.id);
    } else if (user.role === "empresa" || user.role === "administrador") {
      conditions.push("so.company_id = (SELECT id FROM companies WHERE user_id = ?)");
      params.push(user.id);
    }

    if (matchId) { conditions.push("so.match_id = ?"); params.push(matchId); }
    if (loadId) { conditions.push("so.load_id = ?"); params.push(loadId); }
    if (status) { conditions.push("so.status = ?"); params.push(status); }

    const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    const [rows, [{ total }]] = await Promise.all([
      query(`
        SELECT so.*, l.title AS load_title, d.name AS driver_name, c.name AS company_name
        FROM service_orders so
        LEFT JOIN loads l ON so.load_id = l.id
        LEFT JOIN drivers d ON so.driver_id = d.id
        LEFT JOIN companies c ON so.company_id = c.id
        ${where}
        ORDER BY so.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]),
      query(`SELECT COUNT(*) as total FROM service_orders so ${where}`, params),
    ]);

    return paginatedResponse(rows, total, page, limit);
  });

  /**
   * GET /:id — Buscar OS por ID
   */
  app.get("/:id", async (request) => {
    const { id } = request.params;
    const os = await queryOne(`
      SELECT so.*, l.title AS load_title, l.origin_city, l.destination_city,
             l.weight_kg, l.type AS load_type,
             d.name AS driver_name, d.document AS driver_doc,
             c.name AS company_name, c.document AS company_doc
      FROM service_orders so
      LEFT JOIN loads l ON so.load_id = l.id
      LEFT JOIN drivers d ON so.driver_id = d.id
      LEFT JOIN companies c ON so.company_id = c.id
      WHERE so.id = ?
    `, [id]);

    if (!os) {
      throw { statusCode: 404, message: "Ordem de serviço não encontrada" };
    }
    return os;
  });

  /**
   * PATCH /:id — Atualizar OS
   */
  app.patch("/:id", async (request) => {
    const { id } = request.params;
    const body = updateSchema.parse(request.body);

    const sets = [];
    const params = [];

    if (body.type) { sets.push("type = ?"); params.push(body.type); }
    if (body.status) { sets.push("status = ?"); params.push(body.status); }
    if (body.description !== undefined) { sets.push("description = ?"); params.push(body.description); }
    if (body.valueBrl !== undefined) { sets.push("value_brl = ?"); params.push(body.valueBrl); }
    if (body.pdfUrl !== undefined) { sets.push("pdf_url = ?"); params.push(body.pdfUrl); }
    if (body.uploadedDocId !== undefined) { sets.push("uploaded_doc_id = ?"); params.push(body.uploadedDocId); }

    if (sets.length === 0) {
      throw { statusCode: 400, message: "Nenhum campo para atualizar" };
    }

    sets.push("updated_at = CURRENT_TIMESTAMP");
    params.push(id);

    await query(`UPDATE service_orders SET ${sets.join(", ")} WHERE id = ?`, params);
    return await queryOne(`SELECT * FROM service_orders WHERE id = ?`, [id]);
  });

  /**
   * DELETE /:id — Excluir OS
   */
  app.delete("/:id", async (request, reply) => {
    const { id } = request.params;
    const os = await queryOne(`SELECT id FROM service_orders WHERE id = ?`, [id]);
    if (!os) {
      return reply.status(404).send({ error: "Ordem de serviço não encontrada" });
    }
    await query(`DELETE FROM service_orders WHERE id = ?`, [id]);
    return reply.status(204).send();
  });
}
