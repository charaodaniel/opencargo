# OpenCargo — Documentação da API

> Especificação dos endpoints REST e WebSocket da plataforma.

---

## Base URL

```
Desenvolvimento: http://localhost:3000/api
Produção: https://api.opencargo.com.br/api
```

## Autenticação

A maioria dos endpoints requer o header:

```
Authorization: Bearer <token>
```

### Modos de autenticação

O backend suporta **dois modos** de autenticação, detectados automaticamente:

| Modo | Ativação | Fluxo |
|------|----------|-------|
| **Supabase Auth** (produção) | `SUPABASE_URL` configurado | Login via `signInWithPassword()` · Registro via `admin.createUser()` · Token JWT do Supabase verificado via `getUser()` |
| **JWT próprio** (dev/SQLite) | `SUPABASE_URL` vazio | Login via bcrypt + JWT próprio · Registro com hash bcrypt · Token verificado via `@fastify/jwt` |

---

## Health Check

### `GET /api/health`

Verifica se a API está funcionando.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

---

## Auth

### `POST /api/auth/register`

Registrar novo usuário.

**Requisitos de senha:** Mínimo 8 caracteres, 1 letra maiúscula, 1 número e 1 caractere especial.

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "Teste@123",
  "role": "driver"
}
```

**Roles:** `administrador`, `gestor`, `empresa`, `motorista` (apenas `empresa` e `motorista` permitidos no registro via API)

### `POST /api/auth/login`

Login do usuário. Usuários com senha fraca (que não atendem aos requisitos atuais) ainda podem logar, mas a resposta inclui `needsPasswordReset: true`.

**Body:**
```json
{
  "email": "joao@email.com",
  "password": "minhaSenha"
}
```

**Response:**
```json
{
  "token": "jwt_token",
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@email.com",
    "role": "driver"
  },
  "needsPasswordReset": false
}
```

### `PATCH /api/auth/password` 🔐

Alterar a própria senha. Gera um novo token JWT.

**Body:**
```json
{
  "currentPassword": "minhaSenhaAtual",
  "newPassword": "Nova@123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "novo_jwt_token"
}
```

### `GET /api/auth/me` 🔐

Dados do usuário logado.

---

## Users

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|:------------:|
| GET | `/api/users` | Listar usuários (paginado: `{ data, total, page, limit, totalPages }`) | 🔐 |
| GET | `/api/users/:id` | Buscar usuário | 🔐 |
| PATCH | `/api/users/:id` | Atualizar próprio perfil (name, phone) | 🔐 |
| PATCH | `/api/users/:id/admin` | 🔐🔐 Admin: atualizar qualquer usuário (name, email, phone, role, active) | 🔐 Admin |
| DELETE | `/api/users/:id/admin` | 🔐🔐 Admin: excluir usuário | 🔐 Admin |
| GET | `/api/users/admin/all` | 🔐🔐 Admin: listar todos os usuários com detalhes | 🔐 Admin |

---

## Companies

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|:------------:|
| POST | `/api/companies` | Cadastrar empresa | 🔐 |
| GET | `/api/companies` | Listar empresas (paginado) | 🔐 |
| GET | `/api/companies/me` | Empresa do usuário logado | 🔐 |
| GET | `/api/companies/:id` | Buscar empresa | 🔐 |
| PATCH | `/api/companies/:id` | Atualizar empresa | 🔐 |

---

## Drivers

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|:------------:|
| POST | `/api/drivers` | Cadastrar motorista | 🔐 |
| GET | `/api/drivers` | Listar motoristas (paginado) | 🔐 |
| GET | `/api/drivers/me` | Motorista do usuário logado | 🔐 |
| GET | `/api/drivers/available` | Motoristas disponíveis | 🔐 |
| GET | `/api/drivers/:id` | Buscar motorista | 🔐 |
| PATCH | `/api/drivers/:id` | Atualizar motorista | 🔐 |

---

## Vehicles

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|:------------:|
| POST | `/api/vehicles` | Cadastrar veículo | 🔐 |
| GET | `/api/vehicles` | Listar veículos (paginado) | 🔐 |
| GET | `/api/vehicles/:id` | Buscar veículo | 🔐 |
| PATCH | `/api/vehicles/:id` | Atualizar veículo | 🔐 |
| DELETE | `/api/vehicles/:id` | Remover veículo | 🔐 |

---

## Routes

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|:------------:|
| POST | `/api/routes` | Cadastrar rota | 🔐 |
| GET | `/api/routes` | Listar rotas (paginado) | 🔐 |
| GET | `/api/routes/active` | Rotas ativas (paginado) | 🔐 |
| GET | `/api/routes/return` | Rotas de retorno (paginado) | 🔐 |
| GET | `/api/routes/:id` | Buscar rota | 🔐 |
| PATCH | `/api/routes/:id` | Atualizar rota | 🔐 |
| DELETE | `/api/routes/:id` | Remover rota | 🔐 |

---

## Loads

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|:------------:|
| POST | `/api/loads` | Cadastrar carga | 🔐 |
| GET | `/api/loads` | Listar cargas (paginado) | 🔐 |
| GET | `/api/loads/available` | Cargas disponíveis | 🔐 |
| GET | `/api/loads/nearby` | Cargas próximas (GPS ou cidade) | 🔐 |
| GET | `/api/loads/:id` | Buscar carga | 🔐 |
| PATCH | `/api/loads/:id` | Atualizar carga | 🔐 |
| DELETE | `/api/loads/:id` | Remover carga | 🔐 |

---

## Service Orders

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|:------------:|
| POST | `/api/service-orders` | Criar ordem de serviço | 🔐 |

---

## Documents

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|:------------:|
| POST | `/api/documents/upload` | Upload de arquivo | 🔐 |
| GET | `/api/documents/:entityType/:entityId` | Listar documentos | 🔐 |
| DELETE | `/api/documents/:id` | Remover documento | 🔐 |

---

## Reviews

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|:------------:|
| POST | `/api/reviews` | Criar avaliação | 🔐 |
| GET | `/api/reviews` | Listar avaliações (paginado) | 🔐 |
| GET | `/api/reviews/stats/:userId` | Estatísticas de avaliações | 🔐 |

---

## Activity Logs

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|:------------:|
| GET | `/api/logs` | Listar logs (paginado, filtrável) | 🔐 Admin |
| GET | `/api/logs/stats` | Estatísticas dos logs | 🔐 Admin |
| GET | `/api/logs/audit` | Auditoria avançada (top users, horários, dias) | 🔐 Admin |
| GET | `/api/logs/users` | Usuários com registros nos logs | 🔐 Admin |
| GET | `/api/logs/alerts` | Alertas de segurança consolidados | 🔐 Admin |

---

## Freights

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|:------------:|
| GET | `/api/freights` | Listar fretes realizados | 🔐 |
| GET | `/api/freights/stats` | Estatísticas de fretes | 🔐 |

---

## Matching

O sistema de matching conta com **filtros avançados** e algoritmo de **score de compatibilidade** (0-100) baseado em:
- Alinhamento de cidades (50pts)
- Compatibilidade de peso (20pts)
- Compatibilidade de volume (10pts)
- Proximidade de datas (10pts)
- Tipo de veículo vs tipo de carga (10pts)

### Endpoints

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|:------------:|
| GET | `/api/matching/search` | Busca com filtros avançados | 🔐 |
| GET | `/api/matching/loads-for-driver/:id` | Cargas compatíveis para motorista | 🔐 |
| GET | `/api/matching/drivers-for-load/:id` | Motoristas compatíveis para carga | 🔐 |
| GET | `/api/matching/filters` | Opções de filtro disponíveis | 🔐 |
| POST | `/api/matching` | Criar match | 🔐 |
| GET | `/api/matching` | Listar matches | 🔐 |
| PATCH | `/api/matching/:id` | Atualizar status do match | 🔐 |

### `GET /api/matching/search` — Busca Avançada

**Query Parameters:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `type` | `"loads"` \| `"drivers"` | Tipo de busca (default: `loads`) |
| `q` | string | Busca por texto (título, cidades) |
| `originState` | string | UF de origem (ex: SP) |
| `destinationState` | string | UF de destino (ex: RJ) |
| `weightMin` | number | Peso mínimo (kg) |
| `weightMax` | number | Peso máximo (kg) |
| `dateFrom` | string | Data inicial (YYYY-MM-DD) |
| `dateTo` | string | Data final (YYYY-MM-DD) |
| `loadType` | string | Tipo de carga |
| `minScore` | number | Score mínimo (0-100) |
| `sortBy` | `"score"` \| `"date"` \| `"weight"` | Ordenação |
| `sortOrder` | `"asc"` \| `"desc"` | Ordem |

**Exemplo:**
```
GET /api/matching/search?type=loads&originState=SP&weightMax=5000&minScore=50&sortBy=score
```

**Response (`type=loads`):**
```json
{
  "results": [
    {
      "load": { "id": "uuid", "title": "...", "origin_city": "...", ... },
      "route": { "id": "uuid", "driver_name": "João", "origin_city": "...", ... },
      "score": 85,
      "match_reasons": ["Rotas perfeitamente alinhadas", "Peso compatível", "Datas alinhadas"]
    }
  ],
  "total": 1,
  "filters": { "type": "loads", ... }
}
```

**Response (`type=drivers`):**
```json
{
  "results": [
    {
      "load": { "id": "uuid", "title": "...", ... },
      "driver": { "id": "uuid", "name": "João", "city": "...", ... },
      "vehicle": { "model": "...", "type": "...", "capacity_kg": 10000 },
      "route": { "id": "uuid", "departure_date": "...", ... },
      "score": 92,
      "match_reasons": ["Rotas perfeitamente alinhadas", "Peso compatível"]
    }
  ],
  "total": 1,
  "filters": { "type": "drivers", ... }
}
```

### `GET /api/matching/filters` — Opções de Filtro

Retorna as opções disponíveis para popular os dropdowns de filtro.

**Response:**
```json
{
  "states": ["SP", "RJ", "MG", ...],
  "loadTypes": ["Carga Geral", "Carga Frágil", "Carga Frigorífica", "Carga Perigosa", "Granel"],
  "activeTypes": ["Carga Geral", ...]
}
```

---

## Maps

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|:------------:|
| GET | `/api/maps/geocode?city=&state=` | Geocoding via Nominatim (OSM) | ❌ |
| GET | `/api/maps/route?origin=&destination=` | Rota via OSRM | ❌ |

**Exemplo Geocoding:**
```
GET /api/maps/geocode?city=São Paulo&state=SP
```

**Response:**
```json
{
  "lat": -23.5505,
  "lon": -46.6333,
  "display": "São Paulo, Brazil"
}
```

**Exemplo Route:**
```
GET /api/maps/route?origin=São Paulo,SP&destination=Campinas,SP
```

**Response:**
```json
{
  "distance": 93000,
  "duration": 3600,
  "geometry": "..."
}
```

---

## Notifications

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|:------------:|
| GET | `/api/notifications` | Listar notificações | 🔐 |
| PATCH | `/api/notifications/:id/read` | Marcar como lida | 🔐 |
| POST | `/api/notifications/read-all` | Marcar todas como lidas | 🔐 |
| WS | `/api/notifications/ws` | WebSocket para notificações | 🔐 |

---

## Chat

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|:------------:|
| POST | `/api/chat/messages` | Enviar mensagem | 🔐 |
| GET | `/api/chat/messages/:matchId` | Listar mensagens | 🔐 |
| POST | `/api/chat/messages/:matchId/read` | Marcar mensagens como lidas | 🔐 |
| WS | `/api/chat/ws` | WebSocket para chat | 🔐 |

---

## WebSocket

### Conexão

```javascript
const ws = new WebSocket("ws://localhost:3000/api/chat/ws");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
};
```

### Formato das Mensagens (Chat)

**Enviar:**
```json
{
  "type": "chat",
  "matchId": "uuid",
  "senderId": "uuid",
  "content": "Olá, tenho interesse na carga!"
}
```

**Receber:**
```json
{
  "type": "new_message",
  "matchId": "uuid",
  "senderId": "uuid",
  "content": "Olá, tenho interesse na carga!",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```
