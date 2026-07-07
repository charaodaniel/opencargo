# OpenCargo — Deploy

> Guia de instalação local, Docker e produção.

---

## 1. Desenvolvimento Local

### 1.1 Pré-requisitos

- Node.js >= 22
- npm ou pnpm

### 1.2 Backend

```bash
# Acessar o diretório
cd OpenCargo/backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp ../.env.example ../.env

# Iniciar servidor de desenvolvimento
npm run dev
```

O servidor iniciará em `http://localhost:3000`.

### 1.3 Frontend

```bash
cd OpenCargo/frontend

# Se estiver usando um servidor HTTP simples:
npx serve .
```

---

## 2. Docker

### 2.1 Construir e Iniciar

```bash
cd OpenCargo
docker compose up --build
```

### 2.2 Serviços

| Serviço | Porta |
|---------|-------|
| Backend | 3000 |
| Frontend | 5173 |
| Database | - |

### 2.3 Parar

```bash
docker compose down
```

---

## 3. Produção (Manual)

### 3.1 Backend

```bash
cd OpenCargo/backend

# Instalar dependências
npm ci --production

# Build
npm run build

# Iniciar
NODE_ENV=production node dist/index.js
```

### 3.2 Nginx (Proxy Reverso)

```nginx
server {
    listen 80;
    server_name opencargo.example.com;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /var/www/opencargo/frontend;
        try_files $uri $uri/ /index.html;
    }
}
```

### 3.3 PostgreSQL

```sql
CREATE DATABASE opencargo;
CREATE USER opencargo WITH PASSWORD 'sua-senha-forte';
GRANT ALL PRIVILEGES ON DATABASE opencargo TO opencargo;
```

---

## 4. Produção (Docker)

```bash
cd OpenCargo
docker compose -f docker-compose.prod.yml up -d
```

---

## 5. Variáveis de Ambiente

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `PORT` | Porta do servidor | Não (3000) |
| `HOST` | Host do servidor | Não (0.0.0.0) |
| `NODE_ENV` | Ambiente | Sim |
| `JWT_SECRET` | Chave secreta JWT | **Sim** |
| `DATABASE_URL` | URL do banco | Sim |
| `CORS_ORIGIN` | Origem permitida CORS | Sim |

---

## 6. Estrutura de Diretórios (Produção)

```text
/opt/opencargo/
├── backend/
│   ├── dist/
│   ├── node_modules/
│   ├── package.json
│   └── data/
│       └── opencargo.db   # SQLite
├── frontend/
│   └── index.html
├── docker/
├── .env
└── docker-compose.yml
```
