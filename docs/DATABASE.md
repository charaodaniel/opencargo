# OpenCargo — Modelo de Dados

> Documento com o modelo conceitual, entidades e relacionamentos do banco.

---

## Tecnologia

| Ambiente | Banco | ORM |
|----------|-------|-----|
| Desenvolvimento | SQLite | Drizzle ORM |
| Produção | PostgreSQL | Drizzle ORM |

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

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | TEXT (UUID) | Identificador único |
| name | TEXT | Nome completo |
| email | TEXT (unique) | E-mail de login |
| password | TEXT | Hash bcrypt |
| role | TEXT | admin, company, driver |
| phone | TEXT | Telefone de contato |
| active | BOOLEAN | Se o usuário está ativo |
| created_at | TEXT | Data de criação |
| updated_at | TEXT | Data de atualização |

### companies

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | TEXT (UUID) | Identificador único |
| user_id | TEXT (FK) | Referência ao usuário |
| name | TEXT | Nome da empresa |
| document | TEXT (unique) | CNPJ |
| address | TEXT | Endereço |
| city | TEXT | Cidade |
| state | TEXT | Estado (UF) |
| phone | TEXT | Telefone |
| created_at | TEXT | Data de criação |

### drivers

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | TEXT (UUID) | Identificador único |
| user_id | TEXT (FK) | Referência ao usuário |
| name | TEXT | Nome completo |
| document | TEXT (unique) | CPF |
| cnh | TEXT | Número da CNH |
| phone | TEXT | Telefone |
| city | TEXT | Cidade base |
| state | TEXT | Estado (UF) |
| available | BOOLEAN | Disponibilidade |
| created_at | TEXT | Data de criação |

### vehicles

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | TEXT (UUID) | Identificador único |
| driver_id | TEXT (FK) | Referência ao motorista |
| plate | TEXT (unique) | Placa do veículo |
| model | TEXT | Modelo |
| year | INTEGER | Ano |
| capacity_kg | REAL | Capacidade em kg |
| capacity_m3 | REAL | Capacidade em m³ |
| type | TEXT | Tipo (truck, van, etc.) |
| created_at | TEXT | Data de criação |

### routes

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | TEXT (UUID) | Identificador único |
| driver_id | TEXT (FK) | Referência ao motorista |
| origin_city | TEXT | Cidade de origem |
| origin_state | TEXT | Estado de origem |
| destination_city | TEXT | Cidade de destino |
| destination_state | TEXT | Estado de destino |
| departure_date | TEXT | Data de partida |
| arrival_date | TEXT | Data de chegada |
| available_weight | REAL | Peso disponível (kg) |
| available_volume | REAL | Volume disponível (m³) |
| is_return | BOOLEAN | Se é rota de retorno |
| status | TEXT | active, completed, cancelled |
| created_at | TEXT | Data de criação |

### loads

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | TEXT (UUID) | Identificador único |
| company_id | TEXT (FK) | Referência à empresa |
| title | TEXT | Título da carga |
| description | TEXT | Descrição detalhada |
| origin_city | TEXT | Cidade de origem |
| origin_state | TEXT | Estado de origem |
| destination_city | TEXT | Cidade de destino |
| destination_state | TEXT | Estado de destino |
| weight_kg | REAL | Peso em kg |
| volume_m3 | REAL | Volume em m³ |
| type | TEXT | Tipo de carga |
| pickup_date | TEXT | Data de coleta |
| delivery_date | TEXT | Data de entrega |
| status | TEXT | pending, available, matched, in_transit, delivered, cancelled |
| created_at | TEXT | Data de criação |
| updated_at | TEXT | Data de atualização |

### matches

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | TEXT (UUID) | Identificador único |
| load_id | TEXT (FK) | Referência à carga |
| driver_id | TEXT (FK) | Referência ao motorista |
| route_id | TEXT (FK) | Referência à rota |
| score | REAL | Pontuação do match |
| status | TEXT | pending, accepted, rejected, cancelled |
| created_at | TEXT | Data de criação |

### messages

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | TEXT (UUID) | Identificador único |
| match_id | TEXT (FK) | Referência ao match |
| sender_id | TEXT (FK) | Referência ao remetente |
| content | TEXT | Conteúdo da mensagem |
| read | BOOLEAN | Se foi lida |
| created_at | TEXT | Data de envio |

### notifications

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | TEXT (UUID) | Identificador único |
| user_id | TEXT (FK) | Referência ao usuário |
| type | TEXT | Tipo da notificação |
| title | TEXT | Título |
| message | TEXT | Mensagem |
| read | BOOLEAN | Se foi lida |
| created_at | TEXT | Data de criação |

---

## Índices Planejados

```sql
-- Matching: busca por cidade e status
CREATE INDEX idx_loads_origin_dest ON loads(origin_city, destination_city);
CREATE INDEX idx_loads_status ON loads(status);
CREATE INDEX idx_routes_origin_dest ON routes(origin_city, destination_city);
CREATE INDEX idx_routes_status ON routes(status);
CREATE INDEX idx_matches_status ON matches(status);

-- Usuários
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```
