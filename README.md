# OpenCargo 🚛

> Plataforma **open source** para logística colaborativa — conectando cargas disponíveis com caminhões que já realizarão determinada rota, reduzindo viagens vazias e otimizando o transporte.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](https://nodejs.org)
[![Tests](https://img.shields.io/badge/Tests-38%20passing-brightgreen)](https://github.com/charaodaniel/opencargo)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue)](https://www.postgresql.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](docs/CONTRIBUTING.md)
[![GitHub last commit](https://img.shields.io/github/last-commit/charaodaniel/opencargo)](https://github.com/charaodaniel/opencargo/commits/master)
[![GitHub stars](https://img.shields.io/github/stars/charaodaniel/opencargo?style=social)](https://github.com/charaodaniel/opencargo)

---

## 📋 Índice

- [Problema](#-problema)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Quick Start](#-quick-start)
- [API](#-api)
- [Frontend](#-frontend)
- [Mapas](#-mapas)
- [Docker](#-docker)
- [Deploy](#-deploy)
- [Testes](#-testes)
- [Estrutura](#-estrutura)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Documentação](#-documentação)
- [Licença](#-licença)

---

## 🎯 Problema

Milhares de caminhões percorrem diariamente grandes distâncias **vazios** ou parcialmente carregados. Isso gera:

- ⛽ Desperdício de combustível
- 💰 Aumento do custo do frete
- 🌍 Maior emissão de CO₂
- 📉 Baixa rentabilidade do transportador

## 💡 Solução

O **OpenCargo** conecta empresas que precisam transportar cargas com motoristas que já realizarão determinada rota e possuem capacidade ociosa — especialmente no **frete de retorno (backhaul)**.

```text
Exemplo:
São Paulo ──(carregado)──▶ Porto Alegre
                                  │
                          (entrega realizada)
                                  │
                                  ▼
                          Retorno vazio
                                  │
                          Sistema busca cargas
                                  │
                          Motorista aceita
                                  │
                                  ▼
                          Retorno carregado
```

---

## ✨ Funcionalidades

### Para Empresas
- 📦 **Cadastro de cargas** — Informe origem, destino, peso, volume e datas
- 🔗 **Matching inteligente** — Encontre motoristas com rotas compatíveis para frete de retorno
- 💬 **Chat em tempo real** — Comunique-se com motoristas após o match
- 🗺️ **Visualização no mapa** — Veja cargas, rotas e cidades no mapa interativo

### Para Motoristas
- 🛣️ **Cadastro de rotas** — Informe suas viagens programadas e capacidade ociosa
- 🚛 **Gestão de veículos** — Cadastre seus veículos com capacidade em kg e m³
- 🔍 **Oportunidades de carga** — Veja cargas compatíveis com suas rotas de retorno
- 📍 **Busca de cidades** — Autocomplete com Nominatim nos formulários e mapa

### Gerais
- 🔐 **Autenticação JWT** — Registro e login seguro
- 📊 **Dashboard** — Visão geral de cargas, rotas e matches
- 🔔 **Notificações** — Alertas sobre matches e mensagens
- 🗺️ **Mapa interativo** — Leaflet + OpenStreetMap com clustering e dark mode
- 📖 **Swagger** — Documentação interativa da API em `/docs`

---

## 🛠 Tecnologias

| Stack | Tecnologias |
|-------|-------------|
| **Backend** | [Node.js](https://nodejs.org) 22+ · [Fastify](https://fastify.dev) 5 · [Zod](https://zod.dev) |
| **Frontend** | HTML5 · [Tailwind CSS](https://tailwindcss.com) · [Alpine.js](https://alpinejs.dev) · Vanilla JS |
| **Database** | [SQLite](https://www.sqlite.org) (dev) · [PostgreSQL](https://www.postgresql.org) (prod, via Aiven) |
| **Autenticação** | JWT + bcrypt |
| **Mapas** | [Leaflet](https://leafletjs.com) + [OpenStreetMap](https://www.openstreetmap.org) + [Nominatim](https://nominatim.org) + [OSRM](http://project-osrm.org) |
| **Clustering** | [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) |
| **Infra** | [Docker](https://www.docker.com) · [Docker Compose](https://docs.docker.com/compose/) · [Nginx](https://nginx.org) · [Vercel](https://vercel.com) |

---

## 🚀 Quick Start

### Pré-requisitos

- **Node.js** >= 22 ([instalar](https://nodejs.org))
- **npm** (vem com Node.js)

### Desenvolvimento Local

```bash
# Clone o repositório
git clone https://github.com/charaodaniel/opencargo.git
cd opencargo

# Setup automático (instala dependências)
bash scripts/setup.sh

# Inicie o backend
cd backend && npm run dev
```

O servidor iniciará em `http://localhost:3000`.

Acesse a documentação interativa da API: [`http://localhost:3000/docs`](http://localhost:3000/docs)

### Popular com dados de exemplo

```bash
cd backend && npm run seed
```

> Login: `admin@opencargo.com` / `123456`

### Frontend

```bash
cd frontend
npx serve .
```

> O frontend espera a API em `http://localhost:3000/api`.

---

## 📡 API

### Health Check

```http
GET /api/health
```

### Autenticação

```http
POST /api/auth/register     # Registrar (company, driver, admin)
POST /api/auth/login        # Login → retorna JWT
GET  /api/auth/me           # Dados do usuário logado (🔐)
```

### CRUDs

| Entidade | Endpoints | Descrição |
|----------|-----------|-----------|
| 👥 **Users** | `GET /api/users` · `GET /api/users/:id` · `PATCH /api/users/:id` | Gerenciamento de usuários |
| 🏢 **Companies** | `POST/GET /api/companies` · `GET/PATCH /api/companies/:id` | Empresas |
| 🚚 **Drivers** | `POST/GET /api/drivers` · `GET /api/drivers/available` · `GET/PATCH /api/drivers/:id` | Motoristas |
| 🚛 **Vehicles** | `POST/GET /api/vehicles` · `GET/PATCH/DELETE /api/vehicles/:id` | Veículos |
| 🛣️ **Routes** | `POST/GET /api/routes` · `GET /api/routes/active` · `GET/PATCH /api/routes/:id` | Rotas |
| 📦 **Loads** | `POST/GET /api/loads` · `GET /api/loads/available` · `GET/PATCH /api/loads/:id` | Cargas |

### Matching

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/matching/loads-for-driver/:id` | Cargas compatíveis para um motorista |
| `GET` | `/api/matching/drivers-for-load/:id` | Motoristas compatíveis para uma carga |
| `POST` | `/api/matching` | Criar match |
| `GET` | `/api/matching` | Listar matches |
| `PATCH` | `/api/matching/:id` | Atualizar status do match |

### Mapas

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/maps/geocode?city=&state=` | Geocoding via Nominatim |
| `GET` | `/api/maps/route?origin=&destination=` | Rota via OSRM |

### Chat & Notificações

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/chat/messages` | Enviar mensagem |
| `GET` | `/api/chat/messages/:matchId` | Listar mensagens |
| `POST` | `/api/chat/messages/:matchId/read` | Marcar como lidas |
| `WS` | `/api/chat/ws` | WebSocket para chat |
| `GET` | `/api/notifications` | Listar notificações |
| `PATCH` | `/api/notifications/:id/read` | Marcar como lida |
| `POST` | `/api/notifications/read-all` | Marcar todas como lidas |
| `WS` | `/api/notifications/ws` | WebSocket |

> 📖 Documentação completa: [`docs/API.md`](docs/API.md) ou Swagger em `/docs`.

---

## 🗺️ Mapas

O OpenCargo utiliza tecnologias **100% open source** para mapas:

- **Leaflet** — Renderização do mapa com tiles OpenStreetMap (dark mode)
- **MarkerCluster** — Agrupamento inteligente de marcadores para muitas cargas/cidades
- **Nominatim** — Geocoding e autocomplete de cidades nos formulários
- **OSRM** — Cálculo de rotas reais entre cidades (geometria de estradas)

Funcionalidades no frontend:
- Barra de busca de cidades com autocomplete
- Marcadores coloridos por tipo (origem, destino, cargas, cidades)
- Polylines com cores por status (ativo, concluído, cancelado)
- Filtros por tipo (rotas ativas, concluídas, cargas, cidades)
- Clustering automático para performance com muitos dados

---

## 🐳 Docker

```bash
# Construir e iniciar todos os serviços
docker compose up --build

# Em background
docker compose up --build -d

# Parar
docker compose down
```

| Serviço | Porta |
|---------|-------|
| Backend | 3000 |
| Frontend | 5173 |

---

## 🌐 Deploy

### Vercel (Frontend)

O frontend é uma SPA estática pronta para deploy na Vercel:

```bash
# Conecte o repositório no dashboard da Vercel
# https://vercel.com/new

# O vercel.json na raiz do projeto já configura:
# - rootDirectory: "frontend"
# - SPA rewrites (/* → /index.html)
# - Cache headers para assets
```

### Docker (Backend + Frontend)

```bash
git clone https://github.com/charaodaniel/opencargo.git
cd opencargo

# Configure as variáveis de ambiente
cat > .env << EOF
JWT_SECRET=seu-jwt-secret-forte-aqui
CORS_ORIGIN=https://seudominio.com
NODE_ENV=production
DATABASE_URL=postgres://usuario:senha@host:5432/opencargo?sslmode=require
EOF

docker compose up --build -d
```

### PostgreSQL (Produção)

O backend suporta detecção automática: SQLite para desenvolvimento, PostgreSQL para produção.

```bash
# Exemplo: Aiven for PostgreSQL
export DATABASE_URL="postgres://avnadmin:senha@pg-opencargo.l.aivencloud.com:25827/defaultdb?sslmode=require"

# O schema é criado automaticamente na primeira execução
npm run seed  # Popula com dados de exemplo
```

---

## 🧪 Testes

O projeto utiliza o **test runner nativo do Node.js** (`node:test`).

```bash
cd backend

# Executar todos os testes
npm test

# Com filtro
node --test --test-name-pattern="Auth"
```

### Suítes de Teste

| Suite | Testes | O que cobre |
|-------|--------|-------------|
| Health Check | 1 | `GET /api/health` |
| Auth | 7 | Register, Login, Me, duplicatas, 401 |
| Companies CRUD | 5 | CRUD completo + 404 |
| Drivers CRUD | 3 | CRUD + listar disponíveis |
| Vehicles CRUD | 4 | CRUD + duplicata + delete |
| Routes CRUD | 3 | CRUD + filtrar ativas |
| Loads CRUD | 4 | CRUD + status update |
| Matching + Chat | 7 | Fluxo completo: match → mensagem → aceite |
| Notifications | 2 | Listar + marcar lidas |
| Users | 2 | Listar + buscar por ID |

**Total: 38 testes** — compatíveis com SQLite e PostgreSQL.

---

## 📁 Estrutura

```
OpenCargo/
├── backend/                  # API REST (Node.js + Fastify)
│   ├── src/
│   │   ├── auth/            # Autenticação (JWT + bcrypt)
│   │   ├── users/           # Gerenciamento de usuários
│   │   ├── companies/       # CRUD empresas
│   │   ├── drivers/         # CRUD motoristas
│   │   ├── vehicles/        # CRUD veículos
│   │   ├── routes/          # CRUD rotas
│   │   ├── loads/           # CRUD cargas
│   │   ├── matching/        # Motor de matching
│   │   ├── maps/            # Geocoding + OSRM
│   │   ├── notifications/   # Notificações + WebSocket
│   │   ├── chat/            # Chat + WebSocket
│   │   └── common/          # Config, Database, Types
│   ├── tests/               # Testes (38 testes com node:test)
│   ├── scripts/             # Seed de dados
│   └── data/                # Banco SQLite (gitignored)
├── frontend/                 # Interface web (SPA)
│   ├── index.html
│   ├── vercel.json           # Conectado na raiz
│   └── assets/
│       ├── js/
│       │   ├── utils/       # config, api, storage, utils, geocoding
│       │   ├── components/  # Toast, Modal, Table, Card, Navbar, Sidebar
│       │   └── pages/       # dashboard, companies, drivers, vehicles,
│       │                      routes, loads, matching, chat, notifications,
│       │                      maps, login
│       └── css/style.css
├── docs/                     # Documentação
│   ├── API.md               # Referência completa da API
│   ├── DATABASE.md          # Modelo de dados
│   ├── BUSINESS_RULES.md    # Regras de negócio
│   ├── SECURITY.md          # Segurança
│   ├── DEPLOY.md            # Guia de deploy (Docker + Vercel)
│   ├── ROADMAP.md           # Roadmap do projeto
│   └── CONTRIBUTING.md      # Guia para contribuidores
├── docker/                   # Configuração Docker
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
├── scripts/                  # Scripts utilitários
│   ├── setup.sh             # Setup inicial
│   └── seed.sh              # Dados de exemplo
├── database/
│   └── init.sql             # Schema SQL inicial
├── vercel.json               # Configuração Vercel (frontend/)
├── .env.example
├── docker-compose.yml
└── README.md
```

---

## 🔐 Variáveis de Ambiente

| Variável | Descrição | Default | Obrigatório |
|----------|-----------|---------|:-----------:|
| `PORT` | Porta do servidor | `3000` | ❌ |
| `HOST` | Host do servidor | `0.0.0.0` | ❌ |
| `NODE_ENV` | Ambiente (`development`, `production`, `test`) | `development` | ❌ |
| `JWT_SECRET` | Chave secreta JWT | `opencargo-dev-secret` | **⚠️** |
| `JWT_EXPIRES_IN` | Expiração do token | `7d` | ❌ |
| `DATABASE_URL` | URL do banco (SQLite ou PostgreSQL) | `file:./data/opencargo.db` | ❌ |
| `CORS_ORIGIN` | Origem permitida CORS | `http://localhost:5173` | **⚠️** |
| `RATE_LIMIT_MAX` | Máx. requisições por janela | `100` | ❌ |
| `RATE_LIMIT_WINDOW_MS` | Janela de rate limit (ms) | `60000` | ❌ |

> **⚠️ Produção:** Altere `JWT_SECRET` para um valor forte (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).

---

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Arquitetura geral do sistema |
| [`docs/API.md`](docs/API.md) | Referência completa da API REST |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Modelo de dados e entidades |
| [`docs/BUSINESS_RULES.md`](docs/BUSINESS_RULES.md) | Regras de negócio detalhadas |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Autenticação e segurança |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Guia de deploy (Docker + Vercel + PostgreSQL) |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Roadmap e versões planejadas |
| [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) | Guia para contribuidores |

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md).

---

## 📄 Licença

MIT © [Daniel Charão](https://github.com/charaodaniel)

---

<p align="center">Feito com ❤️ para reduzir viagens vazias e tornar o transporte mais eficiente.</p>
