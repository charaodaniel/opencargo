# OpenCargo — Deploy

> Guia de instalação local, Docker, Vercel (frontend) e produção com PostgreSQL no Aiven.

---

## 1. Desenvolvimento Local

### 1.1 Pré-requisitos

- Node.js >= 22
- npm

### 1.2 Setup inicial

```bash
cd opencargo

# Instalar dependências
npm run setup

# Configurar banco de dados
# O .env já está configurado para PostgreSQL no Aiven (produção)
# Para desenvolvimento local com SQLite, altere o .env:
#   DATABASE_URL=file:./data/opencargo.db
```

### 1.3 Iniciar tudo (backend + frontend simultaneamente)

```bash
npm run dev
```

- **Backend**: `http://localhost:3000` — Documentação Swagger em `/docs`
- **Frontend**: `http://localhost:5173`

### 1.4 Comandos individuais

```bash
npm run backend   # Apenas backend
npm run frontend  # Apenas frontend
```

### 1.5 Seed de dados

```bash
npm run seed
# Para resetar os dados primeiro:
cd backend && node scripts/seed.js --reset

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

## 3. Vercel (Frontend — Free Tier)

O frontend é uma **SPA estática** (HTML + Vanilla JS + Tailwind CDN + Alpine.js CDN) e funciona perfeitamente no **free tier da Vercel**, sem necessidade de build.

### 3.1 Configuração

O arquivo `vercel.json` na raiz do projeto já configura tudo:

```json
{
  "rootDirectory": "frontend",   // ← aponta para a pasta do frontend
  "outputDirectory": ".",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 3.2 Deploy (1 clique)

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe o repositório `charaodaniel/opencargo`
3. A Vercel **detecta automaticamente** o `vercel.json` com `rootDirectory: "frontend"`
4. Clique em **Deploy** ⚡

> ⚡ **Free tier:** Sites estáticos são gratuitos e ilimitados na Vercel.
> Sem build command necessário (o frontend é HTML/JS puro com CDN).

### 3.3 Conectando ao Backend em Produção

O frontend em produção precisa saber a URL do backend. Como a Vercel (free tier) serve arquivos **estáticos** sem build step, não é possível usar variáveis de ambiente do servidor.

Em vez disso, edite o arquivo `frontend/assets/js/env.js`:

```js
window.__ENV__ = {
  API_BASE_URL: "https://api.opencargo.com.br/api"  // ← URL do seu backend
};
```

> ⚡ Deixando `API_BASE_URL` vazio (`""`), o frontend usará dados mockados (JSON local).

**Ordem de resolução da URL:**
1. `window.__ENV__.API_BASE_URL` — definido em `env.js` (produção)
2. `http://localhost:3000/api` — quando acessado via `localhost` (desenvolvimento)
3. `""` (vazio) — fallback para dados mockados

---

## 4. Aiven (PostgreSQL — Produção)

O banco de dados PostgreSQL está hospedado no [Aiven](https://aiven.io) (free tier disponível).

### 4.1 Conexão

A `DATABASE_URL` no `.env` segue o formato:

```
postgres://avnadmin:senha@pg-opencargo-opencargo.l.aivencloud.com:25827/defaultdb
```

> ⚠️ **Não use `?sslmode=require`** na URL. O SSL é gerenciado automaticamente pelo adaptador `database-pg.js` com `rejectUnauthorized: false` para Aiven.

### 4.2 Schema

As tabelas são criadas automaticamente na primeira execução (`initDatabase()` em `database.js` / `database-pg.js`).

### 4.3 Seed

```bash
cd backend
DATABASE_URL="postgres://avnadmin:senha@host:25827/defaultdb" node scripts/seed.js --reset
```

### 4.4 Limitações do Aiven Free Tier

| Recurso | Limite |
|---------|--------|
| Storage | 1 GB |
| Conexões | 5 paralelas |
| Superusuário | ❌ (sem `session_replication_role`) |
| SSL | Obrigatório |

> O adaptador já lida com todas essas limitações automaticamente.

---

## 5. Variáveis de Ambiente

### 5.1 Tabela de Variáveis

| Variável | Descrição | Default | Obrigatório |
|----------|-----------|---------|:-----------:|
| `PORT` | Porta do servidor | `3000` | ❌ |
| `HOST` | Host do servidor | `0.0.0.0` | ❌ |
| `NODE_ENV` | Ambiente (`development`, `production`, `test`) | `development` | ❌ |
| `JWT_SECRET` | Chave secreta JWT | `opencargo-dev-secret` | **⚠️** |
| `JWT_EXPIRES_IN` | Expiração do token | `7d` | ❌ |
| `DATABASE_URL` | URL do banco (SQLite ou PostgreSQL) | `file:./data/opencargo.db` | ❌ |
| `CORS_ORIGIN` | Origens CORS (separadas por vírgula) | `http://localhost:5173,http://127.0.0.1:5173` | **⚠️** |
| `RATE_LIMIT_MAX` | Máx. requisições por janela | `100` | ❌ |
| `RATE_LIMIT_WINDOW_MS` | Janela de rate limit (ms) | `60000` | ❌ |

### 5.2 Exemplos de DATABASE_URL

```bash
# Desenvolvimento (SQLite)
DATABASE_URL="file:./data/opencargo.db"

# Produção (Aiven for PostgreSQL)
DATABASE_URL="postgres://avnadmin:senha@pg-opencargo.l.aivencloud.com:25827/defaultdb"
```

> **⚠️ Produção:** Altere `JWT_SECRET` para um valor forte:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 5.3 Configurando no Vercel (Frontend)

Para deploy do frontend na Vercel, você só precisa de **1 variável**:

| Nome | Descrição | Exemplo |
|------|-----------|--------|
| `API_BASE_URL` | URL do backend em produção | `https://api.opencargo.com.br/api` |

**Passo a passo:**
1. Acesse [vercel.com](https://vercel.com) > Dashboard > Seu Projeto
2. Vá em **Settings > Environment Variables**
3. Adicione `API_BASE_URL` com o valor do seu backend
4. Selecione "Production" como ambiente
5. Clique em **Save** e faça um novo deploy

### 5.4 Configurando no Render (Backend)

Para deploy do backend no Render:

1. Acesse [dashboard.render.com](https://dashboard.render.com) > Seu Web Service
2. Vá em **Environment**
3. Adicione todas as variáveis da seção 5.1
4. Destaque para `JWT_SECRET`, `DATABASE_URL` e `CORS_ORIGIN`

> Consulte o arquivo `.env.example` na raiz do projeto para ver todas as variáveis disponíveis.

---

## 6. Arquitetura de Deploy

```text
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Vercel     │     │  Node.js     │     │   Aiven      │
│  (Frontend)  │────▶│  (Backend)   │────▶│ (PostgreSQL) │
│  SPA Estática│     │  Fastify API │     │  Managed DB  │
└──────────────┘     └──────────────┘     └──────────────┘
     :5173                 :3000               :25827
```

- **Frontend:** Vercel (free tier — estático, sem build)
- **Backend:** Servidor Node.js (Render, Railway, Fly.io, ou VPS própria)
- **Banco:** Aiven PostgreSQL (free tier — 1GB storage)

---

## 7. Produção (Backend Manual)

### 7.1 Servidor Node.js

```bash
cd opencargo/backend
npm ci --production

export JWT_SECRET="seu-jwt-secret-forte"
export NODE_ENV=production
export DATABASE_URL="postgres://avnadmin:senha@host:25827/defaultdb"
export CORS_ORIGIN="https://seu-frontend.vercel.app"

node src/index.js
```

### 7.2 Nginx (Proxy Reverso)

```nginx
server {
    listen 80;
    server_name api.opencargo.com.br;

    location / {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 8. Comandos Rápidos

```bash
npm run dev       # Backend + Frontend juntos
npm run backend   # Apenas backend
npm run frontend  # Apenas frontend
npm run seed      # Popular banco com dados de exemplo
npm run test      # Rodar testes
npm run docker    # Docker Compose
```
