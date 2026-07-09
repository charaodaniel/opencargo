/**
 * ── OpenCargo — Activity Logs Routes ──────────────────
 * Histórico de ações dos usuários na plataforma.
 * Apenas administradores têm acesso.
 */

import { query, queryOne, uuid } from "../common/database.js";
import { getPagination, paginatedResponse } from "../common/pagination.js";
import { notifyAdmins } from "../notifications/routes.js";

async function adminOnly(request, reply) {
  if (request.user.role !== "administrador") {
    return reply.status(403).send({ error: "Acesso restrito a administradores" });
  }
}

/**
 * Registra uma ação no log e verifica atividade suspeita
 */
export async function logAction({ user, action, entityType, entityId = null, details = null, ip = null }) {
  try {
    const id = uuid();
    await query(
      `INSERT INTO activity_logs (id, user_id, user_name, action, entity_type, entity_id, details, ip, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [id, user?.id || null, user?.name || "Sistema", action, entityType, entityId, details ? JSON.stringify(details) : null, ip]
    );

    // Verifica atividade suspeita após registrar (não bloqueante)
    if (user && action === "delete") {
      checkSuspiciousActivity(user).catch(err =>
        console.error("Erro ao verificar atividade suspeita:", err)
      );
    }
  } catch (err) {
    console.error("Erro ao registrar log:", err);
  }
}

/**
 * Detecta padrões suspeitos e notifica administradores
 * - 3+ exclusões pelo mesmo usuário nos últimos 5 minutos
 * - 10+ exclusões totais nos últimos 5 minutos
 */
async function checkSuspiciousActivity(user) {
  const fiveMinAgo = "datetime('now', '-5 minutes')";

  // Conta exclusões do mesmo usuário nos últimos 5 min
  const [userDeletes] = await query(
    `SELECT COUNT(*) as count FROM activity_logs
     WHERE user_id = ? AND action = 'delete' AND created_at >= ${fiveMinAgo}`,
    [user.id]
  );

  const userDeleteCount = userDeletes?.count || 0;

  // Evita notificações duplicadas — verifica se já notificamos admins nos últimos 5 min
  const [recentAlert] = await query(
    `SELECT COUNT(*) as count FROM notifications n
     JOIN users u ON n.user_id = u.id
     WHERE n.type = 'system' AND u.role = 'administrador'
     AND n.message LIKE ? AND n.created_at >= ${fiveMinAgo}`,
    [`%${user.name}%exclusões%`]
  );

  if (recentAlert?.count === 0) {
    // Gera alerta se 3+ exclusões pelo mesmo usuário
    if (userDeleteCount >= 3) {
      const label = userDeleteCount >= 5 ? "crítico" : "alerta";
      await notifyAdmins({
        type: "system",
        title: `⚠️ Atividade suspeita (${label})`,
        message: `${user.name} realizou ${userDeleteCount} exclusões nos últimos 5 minutos.`,
      });
      return;
    }

    // Conta exclusões totais nos últimos 5 min
    const [totalDeletes] = await query(
      `SELECT COUNT(*) as count FROM activity_logs
       WHERE action = 'delete' AND created_at >= ${fiveMinAgo}`,
    );

    const totalDeleteCount = totalDeletes?.count || 0;

    // Gera alerta se 10+ exclusões totais
    if (totalDeleteCount >= 10) {
      await notifyAdmins({
        type: "system",
        title: "⚠️ Volume alto de exclusões",
        message: `Foram realizadas ${totalDeleteCount} exclusões nos últimos 5 minutos em toda a plataforma.`,
      });
    }
  }
}

export async function logRoutes(app) {
  app.addHook("onRequest", app.authenticate);

  /**
   * Listar logs com paginação e filtros
   */
  app.get("/", { preHandler: [adminOnly] }, async (request) => {
    const { page, limit, offset } = getPagination(request.query);
    const { action, entity_type, user_id, q, dateFrom, dateTo } = request.query;

    let where = ["1=1"];
    let params = [];

    if (action) { where.push("action = ?"); params.push(action); }
    if (entity_type) { where.push("entity_type = ?"); params.push(entity_type); }
    if (user_id) { where.push("user_id = ?"); params.push(user_id); }
    if (q) { where.push("(user_name LIKE ? OR details LIKE ?)"); params.push(`%${q}%`, `%${q}%`); }
    if (dateFrom) { where.push("created_at >= ?"); params.push(dateFrom); }
    if (dateTo) { where.push("created_at <= ?"); params.push(dateTo); }

    const whereClause = where.join(" AND ");

    const [rows, [{ total }]] = await Promise.all([
      query(
        `SELECT * FROM activity_logs WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ),
      query(`SELECT COUNT(*) as total FROM activity_logs WHERE ${whereClause}`, params),
    ]);

    // Parse details JSON
    const parsed = rows.map(r => ({
      ...r,
      details: r.details ? JSON.parse(r.details) : null,
    }));

    return paginatedResponse(parsed, total, page, limit);
  });

  /**
   * Estatísticas dos logs
   */
  app.get("/stats", { preHandler: [adminOnly] }, async (request) => {
    const [total] = await query(`SELECT COUNT(*) as total FROM activity_logs`);
    const [byAction] = await query(
      `SELECT action, COUNT(*) as count FROM activity_logs GROUP BY action ORDER BY count DESC`
    );
    const [byEntity] = await query(
      `SELECT entity_type, COUNT(*) as count FROM activity_logs GROUP BY entity_type ORDER BY count DESC`
    );
    const [recent30] = await query(
      `SELECT DATE(created_at) as day, COUNT(*) as count FROM activity_logs
       WHERE created_at >= datetime('now', '-30 days')
       GROUP BY DATE(created_at) ORDER BY day ASC`
    );
    const [recent7] = await query(
      `SELECT DATE(created_at) as day, COUNT(*) as count FROM activity_logs
       WHERE created_at >= datetime('now', '-7 days')
       GROUP BY DATE(created_at) ORDER BY day DESC`
    );

    return {
      total: total?.total || 0,
      by_action: byAction || [],
      by_entity: byEntity || [],
      recent_days: recent7 || [],
      daily_30: recent30 || [],
    };
  });

  /**
   * Limpar logs antigos (admin) — query param ?days=30
   */
  app.delete("/cleanup", { preHandler: [adminOnly] }, async (request) => {
    const days = parseInt(request.query.days) || 30;
    const cutoff = `datetime('now', '-${days} days')`;
    const [{ deleted }] = await query(
      `SELECT COUNT(*) as deleted FROM activity_logs WHERE created_at < ${cutoff}`
    );
    await query(`DELETE FROM activity_logs WHERE created_at < ${cutoff}`);
    return { deleted, message: `${deleted} logs removidos (mais de ${days} dias)` };
  });
}
