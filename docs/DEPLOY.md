# OpenCargo — Deploy

> Guia de instalação local, Docker, Vercel e produção com PostgreSQL.

---

## 1. Desenvolvimento Local

### 1.1 Pré-requisitos

- Node.js >= 22
- npm

### 1.2 Backend

```bash
cd opencargo/backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp ../.env.example ../.env

# Iniciar servidor de desenvolvimento
npm run dev
```

O servidor iniciará em `http://localhost:3000`.

**Documentação Swagger:** `http://localhost:3000/docs`

### 1.3 Frontend

```bash
cd opencargo/frontend
npx serve .
```

> O frontend espera a API em `http://localhost:3000/api`.

### 1.4 Seed de dados

```bash
cd opencargo/backend
npm run seed

# Login: admin@opencargo.com / 123456

# Para resetar e reinserir:
npm run seed:reset
```

---

## 2. Docker

### 2.1 Construir e Iniciar

```bash
cd opencargo
docker compose up --build
```

### 2.2 Serviços

| Serviço | Porta |
|---------|-------|
| Backend | 3000 |
| Frontend | 5173 |

### 2.3 Parar

```bash
docker compose down
```

---

## 3. Vercel (Frontend)

O frontend é uma SPA estática configurada para deploy na Vercel.

### 3.1 Pelo Dashboard (recomendado)

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe o repositório `charaodaniel/opencargo`
3. O `vercel.json` na raiz já configura:
   - `rootDirectory: "frontend"` — aponta para a pasta do frontend
   - SPA rewrites (`/*` → `/index.html`)
   - Cache headers para assets (1 ano imutável) e dados (1 hora)

### 3.2 Pela CLI

```bash
npm install -g vercel
cd opencargo
vercel --prod
```

---

## 4. Produção (Manual)

### 4.1 Backend

```bash
cd opencargo/backend

# Instalar apenas dependências de produção
npm ci --production

# Configure as variáveis de ambiente
export JWT_SECRET="seu-jwt-secret-forte-aqui"
export NODE_ENV=production
export DATABASE_URL="postgresql://user:pass@host:5432/opencargo?sslmode=require"
export CORS_ORIGIN="https://seudominio.com"

# Inicie (sem watch)
node src/index.js
```

### 4.2 PostgreSQL (Aiven / Self-hosted)

```bash
# Exemplo: Aiven for PostgreSQL
export DATABASE_URL="postgres://avnadmin:senha@pg-opencargo-opencargo.l.aivencloud.com:25827/defaultdb?sslmode=require"
npm run seed
```

O backend detecta automaticamente o PostgreSQL pela URL (`postgres://` ou `postgresql://`).

### 4.3 Nginx (Proxy Reverso)

```nginx
server {
    listen 80;
    server_name opencargo.example.com;

    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # WebSocket
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

## 5. Variáveis de Ambiente

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

> **⚠️ Produção:** Altere `JWT_SECRET` e `CORS_ORIGIN`. Gere um secret forte com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

### Exemplos de DATABASE_URL

```bash
# SQLite (desenvolvimento)
DATABASE_URL="file:./data/opencargo.db"

# PostgreSQL local
DATABASE_URL="postgres://opencargo:senha@localhost:5432/opencargo"

# Aiven for PostgreSQL
DATABASE_URL="postgres://avnadmin:senha@pg-opencargo.l.aivencloud.com:25827/defaultdb?sslmode=require"
```
