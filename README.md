# OpenCargo 🚛

> Plataforma open source para logística colaborativa — conectando cargas disponíveis com caminhões que já realizarão determinada rota, reduzindo viagens vazias e otimizando o transporte.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Problema

Milhares de caminhões percorrem diariamente grandes distâncias **vazios** ou parcialmente carregados. Isso gera desperdício de combustível, aumento do custo do frete, maior emissão de CO₂ e baixa rentabilidade do transportador.

## Solução

O **OpenCargo** conecta empresas que precisam transportar cargas com motoristas que já realizarão determinada rota e possuem capacidade ociosa — especialmente no **frete de retorno (backhaul)**.

---

## Filosofia

- **🔓 Open Source** — Todo o código é aberto e gratuito
- **🏠 Self Hosted** — Instale no seu próprio servidor
- **🚫 Independência** — Sem dependência de serviços pagos
- **⚡ Performance** — Leve e rápido
- **🧩 Modular** — Módulos independentes

---

## Tecnologias

| Stack | Tecnologias |
|-------|------------|
| Backend | Node.js + Fastify + TypeScript + Drizzle ORM |
| Frontend | HTML5 + Tailwind CSS + Alpine.js |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Mapas | OpenStreetMap + Leaflet |
| Infra | Docker + Docker Compose |

---

## Quick Start

### Desenvolvimento

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/opencargo.git
cd opencargo

# Setup automático
bash scripts/setup.sh

# Inicie o backend
cd backend && npm run dev
```

### Docker

```bash
docker compose up --build
```

Acesse `http://localhost:3000/docs` para a documentação da API.

---

## Estrutura

```
OpenCargo/
├── backend/        # API REST + WebSocket
├── frontend/       # Interface web
├── docs/           # Documentação
├── database/       # Migrations SQL
├── docker/         # Configuração Docker
├── scripts/        # Scripts utilitários
└── tests/          # Testes
```

---

## Documentação

- [Arquitetura](ARCHITECTURE.md)
- [Regras de Negócio](docs/BUSINESS_RULES.md)
- [Modelo de Dados](docs/DATABASE.md)
- [API Reference](docs/API.md)
- [Segurança](docs/SECURITY.md)
- [Deploy](docs/DEPLOY.md)
- [Contribuindo](docs/CONTRIBUTING.md)
- [Roadmap](docs/ROADMAP.md)

---

## Licença

MIT
