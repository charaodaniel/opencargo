# OpenCargo 🚛

> Plataforma **open source** para logística colaborativa — conectando cargas disponíveis com caminhões que já realizarão determinada rota, reduzindo viagens vazias e otimizando o transporte.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](https://nodejs.org)

---

## 📋 Índice

- [Problema](#-problema)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Quick Start](#-quick-start)
- [API](#-api)
- [Docker](#-docker)
- [Testes](#-testes)
- [Estrutura](#-estrutura)
- [Deploy](#-deploy)
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

### Para Motoristas
- 🛣️ **Cadastro de rotas** — Informe suas viagens programadas e capacidade ociosa
- 🚛 **Gestão de veículos** — Cadastre seus veículos com capacidade em kg e m³
- 🔍 **Oportunidades de carga** — Veja cargas compatíveis com suas rotas de retorno

### Gerais
- 🔐 **Autenticação JWT** — Registro e login seguro
- 📊 **Dashboard** — Visão geral de cargas, rotas e matches
- 🔔 **Notificações** — Alertas sobre matches e mensagens
- 📖 **Documentação Swagger** — API documentada em `/docs`

---

## 🛠 Tecnologias

| Stack | Tecnologias |
|-------|-------------|
| **Backend** | [Node.js](https://nodejs.org) 22+ · [Fastify](https://fastify.dev) 5 · [Zod](https://zod.dev) |
| **Frontend** | HTML5 · [Tailwind CSS](https://tailwindcss.com) · [Alpine.js](https://alpinejs.dev) |
| **Database** | [SQLite](https://www.sqlite.org) (dev) · PostgreSQL (prod) |
| **Autenticação** | JWT + bcrypt |
| **Mapas** | [OpenStreetMap](https://www.openstreetmap.org) + [Nominatim](https://nominatim.org) + [OSRM](http://project-osrm.org) |
| **Infra** | [Docker](https://www.docker.com) · [Docker Compose](https://docs.docker.com/compose/) · [Nginx](https://nginx.org) |

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

### Frontend

O frontend é uma aplicação HTML estática. Abra diretamente no navegador:

```bash
# Navegue até a pasta do frontend
cd frontend

# Sirva com um servidor HTTP simples
npx serve .
```

Ou use a extensão [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) no VS Code.

> **Nota:** O frontend espera a API em `http://localhost:3000/api`. Ajuste a URL no arquivo `frontend/src/js/app.js` se necessário.

---

## 📡 API

### Endpoints Principais

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|:---:|
| `GET` | `/api/health` | Health check da API | ❌ |
| `POST` | `/api/auth/register` | Registrar novo usuário | ❌ |
| `POST` | `/api/auth/login` | Login | ❌ |
| `GET` | `/api/auth/me` | Dados do usuário logado | ✅ |

#### Empresas
| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/companies` | Cadastrar empresa |
| `GET` | `/api/companies` | Listar empresas |
| `GET` | `/api/companies/:id` | Buscar empresa |
| `PATCH` | `/api/companies/:id` | Atualizar empresa |

#### Motoristas
| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/drivers` | Cadastrar motorista |
| `GET` | `/api/drivers` | Listar motoristas |
| `GET` | `/api/drivers/available` | Motoristas disponíveis |
| `GET` | `/api/drivers/:id` | Buscar motorista |
| `PATCH` | `/api/drivers/:id` | Atualizar motorista |

#### Veículos
| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/vehicles` | Cadastrar veículo |
| `GET` | `/api/vehicles` | Listar veículos |
| `GET` | `/api/vehicles/:id` | Buscar veículo |
| `PATCH` | `/api/vehicles/:id` | Atualizar veículo |
| `DELETE` | `/api/vehicles/:id` | Remover veículo |

#### Cargas
| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/loads` | Cadastrar carga |
| `GET` | `/api/loads` | Listar cargas |
| `GET` | `/api/loads/available` | Cargas disponíveis |
| `GET` | `/api/loads/:id` | Buscar carga |
| `PATCH` | `/api/loads/:id` | Atualizar carga |

#### Rotas
| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/routes` | Cadastrar rota |
| `GET` | `/api/routes` | Listar rotas |
| `GET` | `/api/routes/active` | Rotas ativas |
| `GET` | `/api/routes/return` | Rotas de retorno |
| `GET` | `/api/routes/:id` | Buscar rota |
| `PATCH` | `/api/routes/:id` | Atualizar rota |

#### Matching
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/matching/loads-for-driver/:id` | Cargas compatíveis p/ motorista |
| `GET` | `/api/matching/drivers-for-load/:id` | Motoristas compatíveis p/ carga |
| `POST` | `/api/matching` | Criar match |
| `GET` | `/api/matching` | Listar matches |
| `PATCH` | `/api/matching/:id` | Atualizar status do match |

#### Chat & Notificações
| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/chat/messages` | Enviar mensagem |
| `GET` | `/api/chat/messages/:matchId` | Listar mensagens |
| `GET` | `/api/notifications` | Listar notificações |
| `PATCH` | `/api/notifications/:id/read` | Marcar como lida |
| `POST` | `/api/notifications/read-all` | Marcar todas como lidas |

> 📖 Documentação completa disponível em [`docs/API.md`](docs/API.md) ou via Swagger em `/docs`.

---

## 🐳 Docker

```bash
# Construir e iniciar todos os serviços
docker compose up --build

# Ou em background
docker compose up --build -d

# Parar serviços
docker compose down

# Ver logs
docker compose logs -f
```

| Serviço | Porta |
|---------|-------|
| Backend | `3000` |
| Frontend | `5173` |

---

## 🧪 Testes

O projeto utiliza o **test runner nativo do Node.js** (`node:test`).

```bash
cd backend

# Executar todos os testes
npm test

# Executar com verbose
node --test --test-name-pattern="Auth"
```

### Suítes de Teste

| Suite | Testes | O que cobre |
|-------|--------|-------------|
| Health Check | 1 | GET /api/health |
| Auth | 7 | Register, Login, Me, duplicatas, 401 |
| Companies CRUD | 5 | CRUD completo + 404 |
| Drivers CRUD | 3 | CRUD + listar disponíveis |
| Vehicles CRUD | 4 | CRUD + duplicata + delete |
| Routes CRUD | 3 | CRUD + filtrar ativas |
| Loads CRUD | 4 | CRUD + status update |
| Matching + Chat | 7 | Fluxo completo: match → mensagem → aceite |
| Notifications | 2 | Listar + marcar lidas |
| Users | 2 | Listar + buscar por ID |

**Total: 38 testes**

---

## 📁 Estrutura

```
OpenCargo/
├── backend/                 # API REST (Node.js + Fastify)
│   ├── src/
│   │   ├── auth/           # Autenticação (JWT + bcrypt)
│   │   ├── users/          # Gerenciamento de usuários
│   │   ├── companies/      # CRUD empresas
│   │   ├── drivers/        # CRUD motoristas
│   │   ├── vehicles/       # CRUD veículos
│   │   ├── routes/         # CRUD rotas
│   │   ├── loads/          # CRUD cargas
│   │   ├── matching/       # Motor de matching
│   │   ├── maps/           # Integração OpenStreetMap
│   │   ├── notifications/  # Notificações + WebSocket
│   │   ├── chat/           # Chat + WebSocket
│   │   └── common/         # Config, Database, Types
│   ├── tests/              # Testes unitários
│   ├── package.json
│   └── data/               # Banco SQLite (gitignored)
├── frontend/                # Interface web
│   ├── index.html
│   └── src/
│       ├── js/app.js       # Alpine.js application
│       └── css/style.css   # Estilos customizados
├── docs/                    # Documentação
│   ├── API.md              # Referência completa da API
│   ├── DATABASE.md         # Modelo de dados
│   ├── BUSINESS_RULES.md   # Regras de negócio
│   ├── SECURITY.md         # Segurança
│   ├── DEPLOY.md           # Guia de deploy
│   └── ROADMAP.md          # Roadmap do projeto
├── docker/                  # Configuração Docker
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
├── scripts/                 # Scripts utilitários
│   ├── setup.sh            # Setup inicial
│   └── seed.sh             # Dados de exemplo
├── database/                # Migrations SQL
│   └── init.sql
├── docker-compose.yml
├── ARCHITECTURE.md
└── README.md
```

---

## 🌐 Deploy

### Docker (Recomendado)

```bash
# Clone e configure
git clone https://github.com/charaodaniel/opencargo.git
cd opencargo

# Crie arquivo .env
cat > .env << EOF
JWT_SECRET=seu-jwt-secret-muito-forte-aqui
CORS_ORIGIN=https://seudominio.com
NODE_ENV=production
EOF

# Inicie
docker compose up --build -d
```

### Manual (Produção)

```bash
cd backend
npm ci --production

# Configure variáveis de ambiente
export JWT_SECRET="seu-jwt-secret"
export NODE_ENV=production
export DATABASE_URL="postgresql://user:pass@localhost:5432/opencargo"
export CORS_ORIGIN="https://seudominio.com"

# Inicie
node src/index.js
```

> ⚠️ Em produção, **altere o JWT_SECRET** para um valor forte e único.
> Considere usar PostgreSQL em vez de SQLite para ambientes de produção.
> Configure Nginx como proxy reverso (veja `docker/nginx.conf`).

---

## 🔐 Variáveis de Ambiente

| Variável | Descrição | Default | Obrigatório |
|----------|-----------|---------|:-----------:|
| `PORT` | Porta do servidor | `3000` | ❌ |
| `HOST` | Host do servidor | `0.0.0.0` | ❌ |
| `NODE_ENV` | Ambiente (`development`, `production`, `test`) | `development` | ❌ |
| `JWT_SECRET` | Chave secreta JWT | `opencargo-dev-secret` | **⚠️** |
| `JWT_EXPIRES_IN` | Tempo de expiração do token | `7d` | ❌ |
| `DATABASE_URL` | URL do banco de dados | `file:./data/opencargo.db` | ❌ |
| `CORS_ORIGIN` | Origem permitida para CORS | `http://localhost:5173` | **⚠️** |
| `RATE_LIMIT_MAX` | Máximo de requisições por janela | `100` | ❌ |
| `RATE_LIMIT_WINDOW_MS` | Janela de rate limit (ms) | `60000` | ❌ |

---

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Arquitetura geral do sistema |
| [`docs/API.md`](docs/API.md) | Referência completa da API REST |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Modelo de dados e entidades |
| [`docs/BUSINESS_RULES.md`](docs/BUSINESS_RULES.md) | Regras de negócio detalhadas |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Autenticação, autorização e segurança |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Guia de deploy em produção |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Roadmap e versões planejadas |

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) para detalhes.

### Como contribuir

1. Faça um fork do projeto
2. Crie uma branch: `git checkout -b feat/minha-feature`
3. Commit suas mudanças: `git commit -m "feat: adiciona nova funcionalidade"`
4. Push: `git push origin feat/minha-feature`
5. Abra um Pull Request

---

## 📄 Licença

MIT © [Daniel Charão](https://github.com/charaodaniel)

---

<p align="center">Feito com ❤️ para reduzir viagens vazias e tornar o transporte mais eficiente.</p>
