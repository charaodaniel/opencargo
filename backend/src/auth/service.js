import bcrypt from "bcryptjs";
import { queryOne, query, uuid } from "../common/database.js";
import { config } from "../common/config.js";

export class AuthService {
  constructor(app) {
    this.app = app;
  }

  async register(input) {
    const hashedPassword = await bcrypt.hash(input.password, 10);
    const id = uuid();

    query(
      `INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)`,
      [id, input.name, input.email, hashedPassword, input.role]
    );

    const user = queryOne(`SELECT id, name, email, role FROM users WHERE id = ?`, [id]);

    const token = this.app.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }

  async login(input) {
    const user = queryOne(`SELECT * FROM users WHERE email = ?`, [input.email]);

    if (!user) {
      throw { statusCode: 401, message: "Credenciais inválidas" };
    }

    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) {
      throw { statusCode: 401, message: "Credenciais inválidas" };
    }

    const token = this.app.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }

  async me(userId) {
    const user = queryOne(
      `SELECT id, name, email, role, created_at FROM users WHERE id = ?`,
      [userId]
    );

    if (!user) {
      throw { statusCode: 404, message: "Usuário não encontrado" };
    }

    return user;
  }
}
