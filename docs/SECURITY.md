# OpenCargo — Segurança

> Documento de segurança, autenticação, autorização e boas práticas.

---

## 1. Autenticação

O OpenCargo suporta dois modos de autenticação, detectados automaticamente:

### 1.1 Supabase Auth (Produção)

Quando `SUPABASE_URL` está configurado, o backend delega toda a autenticação ao Supabase:

- **Login:** `supabase.auth.signInWithPassword()` — verifica credenciais no Supabase Auth
- **Registro:** `supabase.auth.admin.createUser()` — cria usuário no Supabase Auth
- **Verificação de token:** `supabase.auth.getUser()` — valida o JWT do Supabase via API
- **Sincronização:** Trigger `handle_new_user()` no banco cria automaticamente o registro em `public.users` quando alguém se cadastra
- **Role:** Armazenado em `user_metadata.role` no JWT do Supabase, lido pelas políticas RLS

### 1.2 JWT Próprio (Desenvolvimento/SQLite)

Quando `SUPABASE_URL` está vazio, o backend usa seu próprio sistema:

- Tokens JWT são gerados e verificados localmente via `@fastify/jwt`
- O token deve ser enviado no header `Authorization: Bearer <token>`
- Tempo de expiração padrão: 7 dias (configurável via `JWT_EXPIRES_IN`)
- O segredo JWT é configurado via variável de ambiente `JWT_SECRET`

### 1.3 Hash de Senhas (modo local)

- Senhas são armazenadas utilizando **bcrypt** com fator de custo 10
- Nunca armazenar senhas em plain text
- Não há recuperação de senha — apenas redefinição (a implementar)

---

## 2. Autorização

### 2.1 Papéis (Roles)

| Role | Descrição |
|------|-----------|
| `administrador` | Acesso total ao sistema |
| `gestor` | Acesso administrativo limitado |
| `empresa` | Acesso a cargas e matching |
| `motorista` | Acesso a rotas e matching |

### 2.2 Controle de Acesso

- Endpoints protegidos com middleware de autenticação (`app.authenticate`).
- Usuários só podem modificar seus próprios recursos.
- Validação de papel (role) para operações sensíveis.

---

## 3. Proteção de Dados (LGPD)

### 3.1 Dados Pessoais Coletados

- Nome
- E-mail
- CPF / CNPJ
- CNH
- Telefone
- Endereço

### 3.2 Medidas

- Apenas dados essenciais para o funcionamento são coletados.
- Usuários podem solicitar exclusão de seus dados.
- Dados sensíveis (senhas) são armazenados com hash bcrypt.
- Logs de acesso podem ser mantidos para auditoria.

---

## 4. Rate Limiting

- Limite padrão: 100 requisições por minuto.
- Configurável via `RATE_LIMIT_MAX` e `RATE_LIMIT_WINDOW_MS`.
- Implementado via `@fastify/rate-limit`.

---

## 5. CORS

- Origem permitida configurada via `CORS_ORIGIN`.
- Em produção, restringir à origem do frontend.
- Implementado via `@fastify/cors`.

---

## 6. Headers de Segurança (Nginx)

```nginx
add_header X-Frame-Options "DENY";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Referrer-Policy "strict-origin-when-cross-origin";
```

Os headers acima já estão configurados em `docker/nginx.conf`.

---

## 7. Banco de Dados

### SQLite (Desenvolvimento)

- Arquivo `.db` armazenado em `backend/data/`.
- Listado no `.gitignore` — não versionado.
- WAL mode para melhor performance de leitura/escrita concorrente.

### PostgreSQL (Produção — Supabase)

- Conexão via URL com SSL (gerenciado pelo adaptador `database-pg.js`).
- SSL ativado automaticamente para URLs do Supabase.
- RLS (Row Level Security) com políticas por role em todas as tabelas.
- Pool de conexões gerenciado pelo adaptador (`pg.Pool`, max 10 conexões).

---

## 8. Checklist de Segurança para Produção

- [ ] `JWT_SECRET` forte e exclusivo (gere com `require('crypto').randomBytes(32).toString('hex')`)
- [ ] HTTPS configurado
- [ ] CORS restrito ao domínio do frontend
- [ ] Rate limiting ativo
- [ ] Headers de segurança no Nginx
- [ ] Logs de auditoria ativos
- [ ] Backup automático do banco
- [ ] Senhas fortes para todos os serviços
- [ ] Conexão SSL obrigatória para PostgreSQL
