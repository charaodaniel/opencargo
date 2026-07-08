import { z } from "zod";
import { query, queryOne, uuid } from "../common/database.js";

const sendMessageSchema = z.object({
  matchId: z.string(),
  content: z.string().min(1).max(1000),
});

export async function chatRoutes(app) {
  app.addHook("onRequest", app.authenticate);

  /**
   * Enviar mensagem
   */
  app.post("/messages", async (request, reply) => {
    const body = sendMessageSchema.parse(request.body);
    const user = request.user;

    const id = uuid();
    await query(
      `INSERT INTO messages (id, match_id, sender_id, content) VALUES (?, ?, ?, ?)`,
      [id, body.matchId, user.id, body.content]
    );

    const message = await queryOne(`SELECT * FROM messages WHERE id = ?`, [id]);
    return reply.status(201).send(message);
  });

  /**
   * Listar mensagens de um match
   */
  app.get("/messages/:matchId", async (request) => {
    const { matchId } = request.params;

    return await query(
      `SELECT * FROM messages WHERE match_id = ? ORDER BY created_at ASC LIMIT 100`,
      [matchId]
    );
  });

  /**
   * Marcar mensagens como lidas
   */
  app.post("/messages/:matchId/read", async (request) => {
    const { matchId } = request.params;
    const user = request.user;

    await query(
      `UPDATE messages SET read = 1 WHERE match_id = ? AND sender_id = ?`,
      [matchId, user.id]
    );

    return { success: true };
  });

  /**
   * WebSocket para chat em tempo real
   */
  app.get("/ws", { websocket: true }, (socket, request) => {
    socket.on("message", (data) => {
      const message = JSON.parse(data.toString());

      if (message.type === "chat") {
        socket.send(
          JSON.stringify({
            type: "new_message",
            matchId: message.matchId,
            senderId: message.senderId,
            content: message.content,
            timestamp: new Date().toISOString(),
          })
        );
      }
    });
  });
}
