# OpenCargo — Modelo de Dados

> Documento com o modelo conceitual, entidades e relacionamentos do banco.

---

## Tecnologia

| Ambiente | Banco | Driver | Observação |
|----------|-------|--------|------------|
| Desenvolvimento | SQLite | `node:sqlite` (nativo) | Arquivo `.db` em `backend/data/` |
| Produção | PostgreSQL | `pg` (node-postgres) | SSL requerido (Aiven, Railway, etc.) |

**Detecção automática:** O backend identifica o banco pela `DATABASE_URL`:
- `file:./data/opencargo.db` → SQLite
- `postgres://user:pass@host/db` → PostgreSQL

**Placeholders:** O adaptador PostgreSQL normaliza `?` para `$1, $2, $3...` automaticamente.

---

## Diagrama de Entidades

```text
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│    users    │     │  companies   │     │   loads     │
├─────────────┤     ├──────────────┤     ├─────────────┤
│ id (PK)     │◄───►│ id (PK)      │     │ id (PK)     │
│ name        │     │ user_id (FK) │◄────│ company_id  │
│ email       │     │ name         │     │ title       │
│ password    │     │ document     │     │ origin_city │
│ role        │     │ address      │     │ dest_city   │
│ phone       │     │ city         │     │ weight_kg   │
│ active      │     │ state        │     │ volume_m3   │
│ created_at  │     │ created_at   │     │ status      │
└──────┬──────┘     └──────────────┘     └─────────────┘
       │                                        │
       │  ┌──────────────┐     ┌─────────────┐  │
       │  │   drivers    │     │  vehicles   │  │
       │  ├──────────────┤     ├─────────────┤  │
       └─►│ id (PK)      │     │ id (PK)     │  │
          │ user_id (FK) │◄────│ driver_id   │  │
          │ name         │     │ plate       │  │
          │ document     │     │ model       │  │
          │ cnh          │     │ capacity_kg │  │
          │ phone        │     │ capacity_m3 │  │
          │ city         │     │ type        │  │
          │ available    │     └─────────────┘  │
          └──────┬──────┘                       │
                 │                              │
          ┌──────┴──────┐     ┌─────────────┐   │
          │   routes    │     │  matches    │   │
          ├─────────────┤     ├─────────────┤   │
          │ id (PK)     │     │ id (PK)     │   │
          │ driver_id   │     │ load_id (FK)│◄──┘
          │ origin_city │     │ driver_id   │
          │ dest_city   │     │ route_id    │
          │ depart_date │     │ score       │
          │ avail_weight│     │ status      │
          │ is_return   │     │ created_at  │
          │ status      │     └──────┬──────┘
          └─────────────┘            │
                                     │
                            ┌────────┴────────┐
                            │   messages      │
                            ├─────────────────┤
                            │ id (PK)         │
                            │ match_id (FK)   │
                            │ sender_id (FK)  │
                            │ content         │
                            │ read            │
                            │ created_at      │
                            └─────────────────┘
```

---

## Entidades

### users

| Coluna | Tipo SQLite | Tipo PostgreSQL | Descrição |
|--------|-------------|-----------------|-----------|
| id | TEXT (UUID) | UUID DEFAULT uuid_generate_v4() | Identificador único |
| name | TEXT | VARCHAR(255) | Nome completo |
| email | TEXT (unique) | VARCHAR(255) UNIQUE | E-mail de login |
| password | TEXT | VARCHAR(255) | Hash bcrypt |
| role | TEXT | VARCHAR(20) CHECK | admin, company, driver |
| phone | TEXT | VARCHAR(20) | Telefone |
| active | INTEGER (1/0) | INTEGER DEFAULT 1 | Usuário ativo |
| created_at | TEXT | TIMESTAMP DEFAULT NOW() | Data de criação |
| updated_at | TEXT | TIMESTAMP DEFAULT NOW() | Data de atualização |

### companies

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| user_id | UUID (FK → users) | Referência ao usuário |
| name | VARCHAR(255) | Nome da empresa |
| document | VARCHAR(20) (unique) | CNPJ |
| address | TEXT | Endereço |
| city | VARCHAR(100) | Cidade |
| state | VARCHAR(2) | Estado (UF) |
| phone | VARCHAR(20) | Telefone |
| created_at | TIMESTAMP | Data de criação |

### drivers

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| user_id | UUID (FK → users) | Referência ao usuário |
| name | VARCHAR(255) | Nome completo |
| document | VARCHAR(20) (unique) | CPF |
| cnh | VARCHAR(20) | Número da CNH |
| phone | VARCHAR(20) | Telefone |
| city | VARCHAR(100) | Cidade base |
| state | VARCHAR(2) | Estado (UF) |
| available | INTEGER (1/0) | Disponibilidade |
| created_at | TIMESTAMP | Data de criação |

### vehicles

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| driver_id | UUID (FK → drivers) | Referência ao motorista |
| plate | VARCHAR(10) (unique) | Placa do veículo |
| model | VARCHAR(100) | Modelo |
| year | INTEGER | Ano |
| capacity_kg | REAL/DECIMAL | Capacidade em kg |
| capacity_m3 | REAL/DECIMAL | Capacidade em m³ |
| type | VARCHAR(50) | Tipo (truck, van, etc.) |
| created_at | TIMESTAMP | Data de criação |

### routes

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| driver_id | UUID (FK → drivers) | Referência ao motorista |
| origin_city | VARCHAR(100) | Cidade de origem |
| origin_state | VARCHAR(2) | Estado de origem |
| destination_city | VARCHAR(100) | Cidade de destino |
| destination_state | VARCHAR(2) | Estado de destino |
| departure_date | DATE | Data de partida |
| arrival_date | DATE | Data de chegada |
| available_weight | DECIMAL | Peso disponível (kg) |
| available_volume | DECIMAL | Volume disponível (m³) |
| is_return | INTEGER/BOOLEAN | Se é rota de retorno |
| status | VARCHAR(20) | active, completed, cancelled |
| created_at | TIMESTAMP | Data de criação |

### loads

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| company_id | UUID (FK → companies) | Referência à empresa |
| title | VARCHAR(255) | Título da carga |
| description | TEXT | Descrição detalhada |
| origin_city | VARCHAR(100) | Cidade de origem |
| origin_state | VARCHAR(2) | Estado de origem |
| destination_city | VARCHAR(100) | Cidade de destino |
| destination_state | VARCHAR(2) | Estado de destino |
| weight_kg | DECIMAL | Peso em kg |
| volume_m3 | DECIMAL | Volume em m³ |
| type | VARCHAR(50) | Tipo de carga |
| pickup_date | DATE | Data de coleta |
| delivery_date | DATE | Data de entrega |
| status | VARCHAR(20) | pending, available, matched, in_transit, delivered, cancelled |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data de atualização |

### matches

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| load_id | UUID (FK → loads) | Referência à carga |
| driver_id | UUID (FK → drivers) | Referência ao motorista |
| route_id | UUID (FK → routes) | Referência à rota |
| score | DECIMAL | Pontuação do match (0-100) |
| status | VARCHAR(20) | pending, accepted, rejected, cancelled |
| created_at | TIMESTAMP | Data de criação |

### messages

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| match_id | UUID (FK → matches) | Referência ao match |
| sender_id | UUID (FK → users) | Referência ao remetente |
| content | TEXT | Conteúdo da mensagem |
| read | INTEGER/BOOLEAN | Se foi lida |
| created_at | TIMESTAMP | Data de envio |

### notifications

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| user_id | UUID (FK → users) | Referência ao usuário |
| type | VARCHAR(50) | Tipo da notificação |
| title | VARCHAR(255) | Título |
| message | TEXT | Mensagem |
| read | INTEGER/BOOLEAN | Se foi lida |
| created_at | TIMESTAMP | Data de criação |

---

## Índices

```sql
-- Matching: busca por origem/destino e status
CREATE INDEX idx_loads_origin_dest ON loads(origin_city, destination_city);
CREATE INDEX idx_loads_status ON loads(status);
CREATE INDEX idx_routes_origin_dest ON routes(origin_city, destination_city);
CREATE INDEX idx_routes_status ON routes(status);
CREATE INDEX idx_matches_status ON matches(status);

-- Usuários
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Relacionamentos
CREATE INDEX idx_messages_match ON messages(match_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
```
