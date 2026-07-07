# OpenCargo — Architecture

> Documento de arquitetura do projeto OpenCargo — plataforma open source para logística colaborativa.

---

## Visão Geral

O **OpenCargo** é uma plataforma open source para logística colaborativa focada em reduzir viagens vazias, conectar empresas e transportadores e otimizar o aproveitamento da capacidade dos veículos.

O projeto foi concebido para ser modular, escalável e independente de serviços pagos.

Toda a arquitetura prioriza tecnologias open source e self-hosted.

---

## Missão

Reduzir o desperdício no transporte de cargas através do compartilhamento inteligente de rotas e fretes de retorno.

---

## Problema

Milhares de caminhões percorrem diariamente grandes distâncias vazios ou parcialmente carregados.

Isso gera:

- desperdício de combustível
- aumento do custo do frete
- maior emissão de CO₂
- baixa rentabilidade do transportador

O OpenCargo busca conectar cargas disponíveis com caminhões que já realizarão determinada rota.

---

## Filosofia

O projeto segue alguns princípios fundamentais.

### Open Source

Todo o sistema é desenvolvido utilizando tecnologias abertas.

### Self Hosted

O usuário pode instalar toda a plataforma em seu próprio servidor.

### Independência

Evitar dependência de APIs pagas ou serviços que exijam cartão de crédito.

### Performance

Priorizar desempenho e baixo consumo de recursos.

### Modularidade

Todos os módulos são independentes.

### API First

Toda funcionalidade está disponível através da API.

---

## Escopo Inicial

O MVP tem foco exclusivamente em **frete de retorno (Backhaul)**.

Exemplo:

```text
Porto Alegre
        │
        ▼
Uruguaiana

Entrega realizada

↓

Retorno vazio

↓

Sistema procura cargas

↓

Motorista aceita

↓

Retorno carregado
```

O motorista informa apenas que realizará uma rota vazia.

O sistema identifica cargas compatíveis.

---

## Arquitetura Geral

```text
              Frontend (SPA)
              HTML + Tailwind + Alpine.js
                    │
         REST API / WebSocket
                    │
              OpenCargo API (Fastify)
                    │
    ┌───────────────┼───────────────┐
 Auth          Matching          Chat
 Users          Routes      Notifications
 Vehicles       Loads            Maps
                    │
     ┌──────────────┴──────────────┐
     │                             │
  SQLite (dev)          PostgreSQL (prod)
  (file.db)              (Aiven / self-hosted)
```

---

## Tecnologias

### Backend

- Node.js 22+
- Fastify 5
- JavaScript (CommonJS modules)
- JWT + bcrypt
- Zod (validação)

### Banco de Dados

**Desenvolvimento**

- SQLite (via `node:sqlite`, nativo)

**Produção**

- PostgreSQL (via `pg` node-postgres)

**Camada de abstração**

- Adaptador próprio em `backend/src/common/database.js`
- Detecta automaticamente SQLite ou PostgreSQL via `DATABASE_URL`
- Placeholders `?` normalizados para `$1, $2, $3...` no PostgreSQL

### Frontend

- HTML5
- Tailwind CSS (CDN)
- Alpine.js (CDN)
- Vanilla JavaScript modular

### Mapas

Nunca depende de Google Maps. Tecnologias utilizadas:

- **OpenStreetMap** — Tiles de mapa
- **Leaflet** — Renderização de mapa interativo
- **Leaflet.markercluster** — Agrupamento de marcadores
- **Nominatim** — Geocoding e busca de cidades
- **OSRM** — Cálculo de rotas entre cidades

### Comunicação

- REST API (Fastify)
- WebSocket (chat + notificações)

### Infraestrutura

- Docker + Docker Compose
- Nginx (proxy reverso)
- Vercel (frontend deploy)

---

## Estrutura do Projeto

```text
OpenCargo/
├── backend/
│   ├── src/
│   │   ├── auth/           # JWT, registro, login
│   │   ├── users/          # CRUD usuários
│   │   ├── companies/      # CRUD empresas
│   │   ├── drivers/        # CRUD motoristas
│   │   ├── vehicles/       # CRUD veículos
│   │   ├── routes/         # CRUD rotas
│   │   ├── loads/          # CRUD cargas
│   │   ├── matching/       # Motor de matching inteligente
│   │   ├── maps/           # Geocoding (Nominatim) + rotas (OSRM)
│   │   ├── notifications/  # Notificações + WebSocket
│   │   ├── chat/           # Chat + WebSocket
│   │   └── common/         # Config, Database, Types
│   ├── tests/              # 38 testes (node:test)
│   ├── scripts/            # Seed de dados
│   └── data/               # Banco SQLite (gitignored)
├── frontend/
│   └── assets/
│       ├── js/
│       │   ├── utils/      # config, api, storage, utils, geocoding
│       │   ├── components/ # Toast, Modal, Table, Card, Navbar, Sidebar
│       │   └── pages/      # dashboard, companies, drivers, vehicles,
│       │                      routes, loads, matching, chat, notifications,
│       │                      maps, login
│       └── css/style.css
├── docs/                    # Documentação
├── docker/                  # Dockerfiles + nginx.conf
├── scripts/                 # Setup + seed (shell)
├── database/                # init.sql
├── vercel.json              # Config Vercel (rootDirectory: frontend)
├── .env.example
└── docker-compose.yml
```

---

## Arquitetura em Camadas

### Presentation Layer (Frontend)

Interface com o usuário. SPA com Alpine.js, Tailwind CSS, Leaflet.

### API Layer (Backend)

Recebe requisições Fastify, valida com Zod, autentica com JWT.

### Business Layer

Regras de negócio. Matching por cidades. Disponibilidade. Capacidade.

### Persistence Layer

Adaptador de banco que suporta SQLite (dev) e PostgreSQL (prod).

---

## Modelo Conceitual

```text
Usuário → Empresa → Carga → Matching → Motorista → Veículo → Entrega
```

---

## Motor de Matching

### MVP (implementado)

Matching por cidades com score de compatibilidade.

**Critérios:**
- Origem da carga = Destino da rota do motorista
- Destino da carga = Origem da rota do motorista
- Peso da carga ≤ Capacidade disponível do veículo
- Volume da carga ≤ Volume disponível do veículo
- Datas compatíveis

### Evolução Planejada

- distância máxima e desvios permitidos
- cálculo automático de frete
- score de compatibilidade avançado
- otimização com IA

---

## Fluxo Principal

```text
Empresa → Cadastrar carga → Sistema procura caminhões
    → Motorista recebe proposta → Aceita → Coleta → Entrega → Finalização
```

---

## Módulos

### Core

Autenticação, Configuração, Permissões

### Users

Usuários, Empresas, Motoristas

### Vehicles

Cadastro, Capacidade, Documentação

### Routes

Cadastro, Retorno, Paradas, Disponibilidade

### Loads

Cadastro, Peso, Volume, Tipo, Status

### Matching

Motor responsável pela compatibilidade.

### Maps

Geocoding Nominatim + Rotas OSRM.

### Chat

Comunicação entre empresa e motorista via WebSocket.

### Notifications

Notificações em tempo real via WebSocket.

---

## Objetivos de Longo Prazo

- Aplicativo Android / iOS
- Rastreamento em tempo real
- Inteligência Artificial para otimização de cargas
- Integração com cooperativas e ERPs
- Marketplace de fretes
- Plataforma internacional

---

## Objetivo Final

Criar uma plataforma de logística colaborativa open source, moderna, modular e escalável, capaz de reduzir viagens vazias, aumentar a eficiência do transporte de cargas e servir como referência para soluções self-hosted de logística.
