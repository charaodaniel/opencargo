// ── OpenCargo — Reviews Routes ───────────────────────────
// Avaliações entre as partes (empresa avalia motorista, motorista avalia empresa)
// endpoints:
//   POST   /api/reviews          → Criar avaliação
//   GET    /api/reviews          → Listar avaliações (filtro: match_id, user_id, role)
//   GET    /api/reviews/stats/:userId  → Estatísticas de avaliações de um usuário
//   DELETE /api/reviews/:id      → Excluir própria avaliação

import { query, queryOne, uuid } from "../common/database.js";
import { getPagination, paginatedResponse } from "../common/pagination.js";

export async function reviewRoutes(app) {
  app.addHook("onRequest", app.authenticate);

  // ═══════════════════════════════════════════════════════
  //  POST /reviews — Criar avaliação
  // ═══════════════════════════════════════════════════════
  app.post("/", async (request, reply) => {
    const { matchId, score, comment } = request.body;
    const reviewerId = request.user.id;

    // Validações
    if (!matchId) throw { statusCode: 400, message: "matchId é obrigatório" };
    if (!score || score < 1 || score > 5) {
      throw { statusCode: 400, message: "Score deve ser entre 1 e 5" };
    }

    // Verifica se o match existe
    const match = await queryOne(`SELECT * FROM matches WHERE id = ?`, [matchId]);
    if (!match) throw { statusCode: 404, message: "Match não encontrado" };

    // Verifica se o match foi concluído
    if (match.status !== "completed") {
      throw { statusCode: 400, message: "Só é possível avaliar matches concluídos" };
    }

    // Verifica se o usuário é parte do match
    const load = await queryOne(`SELECT company_id FROM loads WHERE id = ?`, [match.load_id]);
    const matchDriver = await queryOne(`SELECT user_id FROM drivers WHERE id = ?`, [match.driver_id]);
    const matchCompany = load ? await queryOne(`SELECT user_id FROM companies WHERE id = ?`, [load.company_id]) : null;

    const isDriver = matchDriver?.user_id === reviewerId;
    const isCompany = matchCompany?.user_id === reviewerId;

    if (!isDriver && !isCompany) {
      throw { statusCode: 403, message: "Você não é parte deste match" };
    }

    // Determina quem está sendo avaliado (reviewee_id)
    let revieweeId;
    if (isDriver) {
      revieweeId = matchCompany?.user_id;
    } else {
      revieweeId = matchDriver?.user_id;
    }

    if (!revieweeId) throw { statusCode: 404, message: "Parte avaliada não encontrada" };

    // Verifica se já avaliou este match
    const existing = await queryOne(
      `SELECT id FROM reviews WHERE match_id = ? AND reviewer_id = ?`,
      [matchId, reviewerId]
    );
    if (existing) throw { statusCode: 409, message: "Você já avaliou este match" };

    const id = uuid();
    await query(
      `INSERT INTO reviews (id, match_id, reviewer_id, reviewee_id, score, comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, matchId, reviewerId, revieweeId, score, comment || null]
    );

    const review = await queryOne(`SELECT * FROM reviews WHERE id = ?`, [id]);
    return reply.status(201).send(review);
  });

  // ═══════════════════════════════════════════════════════
  //  GET /reviews — Listar avaliações
  //  Query params: match_id, user_id, role (given|received)
  // ═══════════════════════════════════════════════════════
  app.get("/", async (request) => {
    const { match_id, user_id, role } = request.query;
    const { page, limit, offset } = getPagination(request.query);

    let selectSql = `SELECT r.*, u.name as reviewer_name, rev.name as reviewee_name
                     FROM reviews r
                     LEFT JOIN users u ON r.reviewer_id = u.id
                     LEFT JOIN users rev ON r.reviewee_id = rev.id`;
    const conditions = [];
    const params = [];

    if (match_id) {
      conditions.push("r.match_id = ?");
      params.push(match_id);
    }

    if (user_id) {
      if (role === "given") {
        conditions.push("r.reviewer_id = ?");
        params.push(user_id);
      } else if (role === "received") {
        conditions.push("r.reviewee_id = ?");
        params.push(user_id);
      } else {
        conditions.push("(r.reviewer_id = ? OR r.reviewee_id = ?)");
        params.push(user_id, user_id);
      }
    }

    const whereClause = conditions.length > 0 ? " WHERE " + conditions.join(" AND ") : "";

    const [rows, [{ total }]] = await Promise.all([
      query(`${selectSql}${whereClause} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]),
      query(`SELECT COUNT(*) as total FROM reviews r${whereClause}`, params),
    ]);

    return paginatedResponse(rows, total, page, limit);
  });

  // ═══════════════════════════════════════════════════════
  //  GET /reviews/stats/:userId — Estatísticas de avaliações
  // ═══════════════════════════════════════════════════════
  app.get("/stats/:userId", async (request) => {
    const { userId } = request.params;

    const stats = await queryOne(
      `SELECT
         COUNT(*) as total_reviews,
         ROUND(AVG(score), 1) as average_score,
         SUM(CASE WHEN score = 5 THEN 1 ELSE 0 END) as five_stars,
         SUM(CASE WHEN score = 4 THEN 1 ELSE 0 END) as four_stars,
         SUM(CASE WHEN score = 3 THEN 1 ELSE 0 END) as three_stars,
         SUM(CASE WHEN score = 2 THEN 1 ELSE 0 END) as two_stars,
         SUM(CASE WHEN score = 1 THEN 1 ELSE 0 END) as one_star
       FROM reviews WHERE reviewee_id = ?`,
      [userId]
    );

    return stats || {
      total_reviews: 0,
      average_score: 0,
      five_stars: 0,
      four_stars: 0,
      three_stars: 0,
      two_stars: 0,
      one_star: 0,
    };
  });

  // ═══════════════════════════════════════════════════════
  //  DELETE /reviews/:id — Excluir própria avaliação
  // ═══════════════════════════════════════════════════════
  app.delete("/:id", async (request, reply) => {
    const { id } = request.params;
    const userId = request.user.id;

    const review = await queryOne(`SELECT * FROM reviews WHERE id = ?`, [id]);
    if (!review) throw { statusCode: 404, message: "Avaliação não encontrada" };
    if (review.reviewer_id !== userId) {
      throw { statusCode: 403, message: "Você só pode excluir suas próprias avaliações" };
    }

    await query(`DELETE FROM reviews WHERE id = ?`, [id]);
    return reply.status(204).send();
  });
}
