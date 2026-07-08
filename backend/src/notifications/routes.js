import { query, queryOne, uuid } from "../common/database.js";
import { getPagination, paginatedResponse } from "../common/pagination.js";

export async function notificationRoutes(app) {
  app.addHook("onRequest", app.authenticate);

  /**
   * Listar notificações do usuário logado
   */
  app.get("/", async (request) => {
    const user = request.user;
    const { page, limit, offset } = getPagination(request.query);

    const [rows, [{ total }]] = await Promise.all([
      query(
        `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [user.id, limit, offset]
      ),
      query(`SELECT COUNT(*) as total FROM notifications WHERE user_id = ?`, [user.id]),
    ]);

    return paginatedResponse(rows, total, page, limit);
  });

  /**
   * Marcar notificação como lida
   */
  app.patch("/:id/read", async (request) => {
    const { id } = request.params;

    await query(`UPDATE notifications SET read = 1 WHERE id = ?`, [id]);

    return await queryOne(`SELECT * FROM notifications WHERE id = ?`, [id]);
  });

  /**
   * Marcar todas como lidas
   */
  app.post("/read-all", async (request) => {
    const user = request.user;

    await query(`UPDATE notifications SET read = 1 WHERE user_id = ?`, [user.id]);

    return { success: true };
  });

  /**
   * WebSocket para notificações em tempo real
   */
  app.get("/ws", { websocket: true }, (socket, request) => {
    const user = request.user;

    socket.on("message", async (data) => {
      const message = JSON.parse(data.toString());

      if (message.type === "subscribe") {
        socket.send(
          JSON.stringify({
            type: "subscribed",
            userId: user.id,
          })
        );
      }
    });

    socket.on("close", () => {
      console.log(`WebSocket desconectado: ${user.id}`);
    });
  });
}
