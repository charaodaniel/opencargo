import bcrypt from "bcryptjs";
import { queryOne, query, uuid } from "../common/database.js";
import { config, isSupabaseAuth } from "../common/config.js";
import { createClient } from "@supabase/supabase-js";

let _supabase = null;
let _supabaseAnon = null;

function getSupabase() {
  if (_supabase) return _supabase;
  _supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return _supabase;
}

function getSupabaseAnon() {
  if (_supabaseAnon) return _supabaseAnon;
  _supabaseAnon = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _supabaseAnon;
}

export class AuthService {
  constructor(app) {
    this.app = app;
  }

  async register(input) {
    if (isSupabaseAuth()) {
      // ── Modo Supabase Auth ──────────────────────────────────
      const supabase = getSupabase();

      // Cria usuário no Supabase Auth (o trigger handle_new_user()
      // vai sincronizar para public.users automaticamente)
      const { data, error } = await supabase.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
        user_metadata: {
          name: input.name,
          role: input.role,
        },
      });

      if (error) {
        throw { statusCode: 400, message: error.message };
      }

      const authUser = data.user;

      // Garante que o registro em public.users existe
      let user = await queryOne(
        `SELECT id, name, email, role, phone FROM users WHERE id = ?`,
        [authUser.id]
      );

      if (!user) {
        // Se o trigger não criou ainda, insere manualmente
        await query(
          `INSERT INTO users (id, name, email, role, updated_at) VALUES (?, ?, ?, ?, ?)
           ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, updated_at = excluded.updated_at`,
          [authUser.id, input.name, input.email, input.role, new Date().toISOString()]
        );
        user = { id: authUser.id, name: input.name, email: input.email, role: input.role };
      }

      // Gera um token de sessão via signInWithPassword
      const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (sessionError) {
        throw { statusCode: 500, message: "Erro ao gerar sessão" };
      }

      return {
        token: sessionData.session.access_token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      };
    } else {
      // ── Modo local (bcrypt + JWT próprio) ─────────────────
      const hashedPassword = await bcrypt.hash(input.password, 10);
      const id = uuid();

      await query(
        `INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)`,
        [id, input.name, input.email, hashedPassword, input.role]
      );

      const user = await queryOne(`SELECT id, name, email, role FROM users WHERE id = ?`, [id]);

      const token = this.app.jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        { expiresIn: config.JWT_EXPIRES_IN }
      );

      return {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      };
    }
  }

  async login(input) {
    if (isSupabaseAuth()) {
      // ── Modo Supabase Auth ──────────────────────────────────
      const supabase = getSupabase();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error) {
        throw { statusCode: 401, message: "Credenciais inválidas" };
      }

      const authUser = data.user;

      // Busca dados complementares em public.users
      let user = await queryOne(
        `SELECT id, name, email, role, phone FROM users WHERE id = ?`,
        [authUser.id]
      );

      if (!user) {
        // Se o trigger não criou, insere com dados do metadata
        const meta = authUser.user_metadata || {};
        user = {
          id: authUser.id,
          name: meta.name || authUser.email,
          email: authUser.email,
          role: meta.role || "motorista",
        };
        await query(
          `INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, ?)
           ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name`,
          [user.id, user.name, user.email, user.role]
        );
      }

      return {
        token: data.session.access_token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      };
    } else {
      // ── Modo local (bcrypt + JWT próprio) ─────────────────
      const user = await queryOne(`SELECT * FROM users WHERE email = ?`, [input.email]);

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
  }

  async me(userId) {
    const user = await queryOne(
      `SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?`,
      [userId]
    );

    if (!user) {
      throw { statusCode: 404, message: "Usuário não encontrado" };
    }

    return user;
  }

  /**
   * Verifica um token JWT — funciona com Supabase JWT ou JWT próprio
   * @param {string} token
   * @returns {Promise<{id: string, email: string, role: string}>}
   */
  async verifyToken(token) {
    if (!isSupabaseAuth()) {
      // Modo local — usa o JWT do Fastify
      return this.app.jwt.verify(token);
    }

    // Modo Supabase Auth — verifica via Supabase Auth API
    const supabase = getSupabaseAnon();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      throw new Error("Token inválido");
    }

    const authUser = data.user;
    const meta = authUser.user_metadata || {};

    return {
      id: authUser.id,
      email: authUser.email,
      role: meta.role || "motorista",
    };
  }
}
