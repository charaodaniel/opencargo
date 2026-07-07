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

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "123456",
  "role": "driver"
}
```

**Roles:** `admin`, `company`, `driver`

### `POST /api/auth/login`

Login do usuário.

**Body:**
```json
{
  "email": "joao@email.com",
  "password": "123456"
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
  }
}
```

### `GET /api/auth/me` 🔐

Dados do usuário logado.

---

## Users

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|:------------:|
| GET | `/api/users` | Listar usuários | 🔐 |
| GET | `/api/users/:id` | Buscar usuário | 🔐 |
| PATCH | `/api/users/:id` | Atualizar usuário | 🔐 |

---

## Companies

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|:------------:|
| POST | `/api/companies` | Cadastrar empresa | 🔐 |
| GET | `/api/companies` | Listar empresas | 🔐 |
| GET | `/api/companies/:id` | Buscar empresa | 🔐 |
| PATCH | `/api/companies/:id` | Atualizar empresa | 🔐 |

---

## Drivers

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|:------------:|
| POST | `/api/drivers` | Cadastrar motorista | 🔐 |
| GET | `/api/drivers` | Listar motoristas | 🔐 |
| GET | `/api/drivers/available` | Motoristas disponíveis | 🔐 |
| GET | `/api/drivers/:id` | Buscar motorista | 🔐 |
| PATCH | `/api/drivers/:id` | Atualizar motorista | 🔐 |

---

## Vehicles

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|:------------:|
| POST | `/api/vehicles` | Cadastrar veículo | 🔐 |
| GET | `/api/vehicles` | Listar veículos | 🔐 |
| GET | `/api/vehicles/:id` | Buscar veículo | 🔐 |
| PATCH | `/api/vehicles/:id` | Atualizar veículo | 🔐 |
| DELETE | `/api/vehicles/:id` | Remover veículo | 🔐 |

---

## Routes

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|:------------:|
| POST | `/api/routes` | Cadastrar rota | 🔐 |
| GET | `/api/routes` | Listar rotas | 🔐 |
| GET | `/api/routes/active` | Rotas ativas | 🔐 |
| GET | `/api/routes/return` | Rotas de retorno | 🔐 |
| GET | `/api/routes/:id` | Buscar rota | 🔐 |
| PATCH | `/api/routes/:id` | Atualizar rota | 🔐 |

---

## Loads

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|:------------:|
| POST | `/api/loads` | Cadastrar carga | 🔐 |
| GET | `/api/loads` | Listar cargas | 🔐 |
| GET | `/api/loads/available` | Cargas disponíveis | 🔐 |
| GET | `/api/loads/:id` | Buscar carga | 🔐 |
| PATCH | `/api/loads/:id` | Atualizar carga | 🔐 |

---

## Matching

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|:------------:|
| GET | `/api/matching/loads-for-driver/:id` | Cargas compatíveis para motorista | 🔐 |
| GET | `/api/matching/drivers-for-load/:id` | Motoristas compatíveis para carga | 🔐 |
| POST | `/api/matching` | Criar match | 🔐 |
| GET | `/api/matching` | Listar matches | 🔐 |
| PATCH | `/api/matching/:id` | Atualizar status do match | 🔐 |

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
