# OpenCargo — Deploy

> Guia de instalação local, Docker, Vercel, Render e produção com PostgreSQL.

---

## 1. Desenvolvimento Local

### 1.1 Pré-requisitos

- Node.js >= 22
- npm

### 1.2 Iniciar tudo

```bash
cd opencargo

# Instalar dependências
npm run setup

# Iniciar backend + frontend simultaneamente
npm run dev
```

- **Backend**: `http://localhost:3000` — Documentação Swagger em `/docs`
- **Frontend**: `http://localhost:5173`

### 1.3 Seed de dados

```bash
npm run seed
# Login: admin@opencargo.com / 123456
```

---

## 2. Docker

```bash
cd opencargo
docker compose up --build
```

| Serviço | Porta |
|---------|-------|
| Backend | 3000 |
| Frontend | 5173 |

---

## 3. Vercel (Frontend)

Frontend SPA configurada para deploy na Vercel via `vercel.json` (na raiz).

**Dashboard:** [vercel.com/new](https://vercel.com/new) → Importe `charaodaniel/opencargo`

> ⚠️ Configure **Root Directory** como `frontend` nas Settings do projeto.

---

## 4. Render (Backend + PostgreSQL)

O [Render](https://render.com) oferece hospedagem managed para Node.js com suporte a WebSocket e PostgreSQL no free tier.

### 4.1 Blueprint (recomendado)

O `render.yaml` na raiz configura automaticamente:

| Recurso | Plano | Região |
|---------|-------|--------|
| Web Service (Fastify) | Free | South Brazil (São Paulo) |
| PostgreSQL | Free | South Brazil (São Paulo) |

**Passo a passo:**

1. Crie uma conta em [render.com](https://render.com)
2. Conecte seu repositório GitHub
3. Acesse o [Dashboard](https://dashboard.render.com) → **New** → **Blueprint**
4. Selecione o repositório `charaodaniel/opencargo`
5. O Render detecta o `render.yaml` automaticamente
6. Configure as variáveis de ambiente que exigem input manual:

| Variável | Valor | Obrigatório |
|----------|-------|:-----------:|
| `JWT_SECRET` | Gere com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | **⚠️** |
| `CORS_ORIGIN` | URL do frontend (ex: `https://opencargo.vercel.app`) | **⚠️** |

7. Clique em **Apply** e aguarde o deploy (~5 min)

### 4.2 Pós-deploy

Após o deploy, o backend estará disponível em `https://opencargo-api.onrender.com`.

**Atualize o frontend:**

No arquivo `frontend/assets/js/utils/config.js`, altere `API_BASE_URL`:

```js
API_BASE_URL: "https://opencargo-api.onrender.com/api"
```

**Popule o banco com dados de exemplo:**

```bash
# Conecte via Render Dashboard → Shell
cd backend && npm run seed
```

---

## 5. Produção (Manual)

### 5.1 Backend

```bash
cd opencargo/backend
npm ci --production

export JWT_SECRET="seu-jwt-secret-forte"
export NODE_ENV=production
export DATABASE_URL="postgresql://user:pass@host:5432/opencargo?sslmode=require"
export CORS_ORIGIN="https://seudominio.com"

node src/index.js
```

### 5.2 Nginx (Proxy Reverso)

```nginx
server {
    listen 80;
    server_name opencargo.example.com;

    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location / {
        root /var/www/opencargo/frontend;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 6. Variáveis de Ambiente

| Variável | Descrição | Default | Obrigatório |
|----------|-----------|---------|:-----------:|
| `PORT` | Porta do servidor | `3000` | ❌ |
| `HOST` | Host do servidor | `0.0.0.0` | ❌ |
| `NODE_ENV` | Ambiente | `development` | ❌ |
| `JWT_SECRET` | Chave secreta JWT | `opencargo-dev-secret` | **⚠️** |
| `JWT_EXPIRES_IN` | Expiração do token | `7d` | ❌ |
| `DATABASE_URL` | URL do banco | `file:./data/opencargo.db` | ❌ |
| `CORS_ORIGIN` | Origem permitida CORS | `http://localhost:5173` | **⚠️** |
| `RATE_LIMIT_MAX` | Máx. requisições/ janela | `100` | ❌ |
| `RATE_LIMIT_WINDOW_MS` | Janela rate limit (ms) | `60000` | ❌ |

### Exemplos de DATABASE_URL

```bash
# Desenvolvimento (SQLite)
DATABASE_URL="file:./data/opencargo.db"

# Produção (PostgreSQL local)
DATABASE_URL="postgres://opencargo:senha@localhost:5432/opencargo"

# Aiven for PostgreSQL
DATABASE_URL="postgres://avnadmin:senha@pg-opencargo.l.aivencloud.com:25827/defaultdb?sslmode=require"

# Render PostgreSQL (gerado automaticamente pelo Blueprint)
DATABASE_URL="postgres://user:pass@us-east-1.render.com:5432/opencargo_db"
```
