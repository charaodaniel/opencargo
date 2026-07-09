# OpenCargo — Contexto para Recriação UI/UX (Google Gemini / AI Studio)

> Este documento descreve toda a arquitetura do frontend do OpenCargo para que o Google AI Studio (Gemini) possa entender o projeto e recriar a interface com uma UI/UX moderna e refinada.
>
> **Stack atual:** HTML + Tailwind CSS + Vanilla JavaScript (SPA sem framework)
> **Objetivo:** Pode recriar em React, Vue, ou manter vanilla — a escolha é livre.

---

## Sumário

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Design System](#2-design-system)
3. [Estrutura de Arquivos](#3-estrutura-de-arquivos)
4. [Páginas (Pages)](#4-páginas-pages)
5. [Componentes (Components)](#5-componentes-components)
6. [Sistema de Roteamento](#6-sistema-de-roteamento)
7. [Sistema de Internacionalização (i18n)](#7-sistema-de-internacionalização-i18n)
8. [Serviço de API](#8-serviço-de-api)
9. [Fluxo de Autenticação](#9-fluxo-de-autenticação)
10. [Endpoints da API](#10-endpoints-da-api)
11. [Regras de Negócio Importantes](#11-regras-de-negócio-importantes)
12. [Cores e Ícones](#12-cores-e-ícones)

---

## 1. Visão Geral do Projeto

**OpenCargo** é uma plataforma open source de logística colaborativa que conecta empresas com cargas a motoristas com rotas compatíveis, reduzindo viagens vazias.

**Públicos:**
- **Administradores:** Gerenciam toda a plataforma
- **Empresas:** Cadastram cargas para transporte
- **Motoristas:** Cadastram rotas e veículos, aceitam cargas
- **Gestores:** Visão intermediária entre admin e empresa

**Fluxo principal:**
```
Empresa cadastra carga → Motorista cadastra rota → 
Sistema faz matching (compatibilidade) → 
Empresa e motorista conversam via chat → 
Match aceito → Transporte realizado → Avaliação
```

---

## 2. Design System

### 2.1 Tema

O sistema usa **CSS Variables** com suporte a tema **claro** e **escuro** (dark mode via classe `.dark` no `<html>`).

```css
/* Tema Claro (padrão) */
:root {
  --background: 220 20% 97%;
  --foreground: 222 20% 12%;
  --primary: 221 83% 53%;      /* Azul */
  --primary-foreground: 0 0% 100%;
  --secondary: 220 14% 90%;
  --muted: 220 14% 90%;
  --muted-foreground: 218 11% 55%;
  --destructive: 0 84% 60%;    /* Vermelho */
  --success: 142 71% 45%;      /* Verde */
  --warning: 38 92% 50%;       /* Amarelo */
  --border: 220 13% 85%;
  --radius: 0.5rem;
  
  /* Sidebar */
  --sidebar-background: 0 0% 100%;
  --sidebar-foreground: 222 20% 12%;
  --sidebar-accent: 220 14% 90%;
  --sidebar-border: 220 13% 85%;
}

/* Tema Escuro */
.dark {
  --background: 231 18% 7%;     /* Quase preto azulado */
  --foreground: 245 22% 91%;
  --primary: 221 100% 84%;      /* Azul claro */
  --border: 224 12% 20%;
  --sidebar-background: 231 18% 6%;
  --sidebar-foreground: 245 22% 85%;
  --sidebar-accent: 231 12% 18%;
  --sidebar-border: 224 12% 18%;
}
```

Classes Tailwind customizadas (definidas no `tailwind.config.js`):
- `bg-background`, `text-foreground`
- `bg-card`, `text-card-foreground`
- `bg-primary`, `text-primary-foreground`
- `bg-sidebar`, `text-sidebar-foreground`
- `border-border`, `ring-ring`

### 2.2 Efeitos Visuais

- **Glass Card:** `.glass-card` — fundo semi-transparente com `backdrop-filter: blur(12px)`
- **Fade In:** `.fade-in` — animação de entrada com `opacity` + `translateY`
- **Glow:** `.glow-pulse` — brilho pulsante
- **Spin do tema:** `.theme-spin` — rotação ao alternar dark/light
- **Status dots:** `.status-dot.active` — bolinha verde pulsante
- **Hover icons:** `.icon-hover` — escala ao passar mouse

### 2.3 Layout

- **Sidebar:** Fixa à esquerda, 16rem (colapsável para 4rem mobile)
- **Navbar:** Topo fixo, 4rem de altura
- **Conteúdo:** `margin-left: var(--sidebar-width)` em desktop
- **Responsivo:** Mobile-first com breakpoints Tailwind (sm, md, lg, xl)

### 2.4 Tipografia

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
             "Helvetica Neue", Arial, sans-serif;
```

---

## 3. Estrutura de Arquivos (Frontend)

```
frontend/
├── index.html              # Entry point SPA (todos os scripts carregados aqui)
├── offline.html            # Página offline PWA
├── manifest.json           # Manifest PWA
├── sw.js                   # Service Worker (cache + offline)
├── tailwind.config.js      # Config Tailwind com cores customizadas
├── package.json            # Dependências (tailwindcss + build scripts)
├── assets/
│   ├── css/
│   │   ├── tailwind.css         # Input Tailwind (@tailwind directives)
│   │   ├── tailwind.min.css     # CSS compilado (produção)
│   │   └── style.css            # CSS custom (design system + animações)
│   └── js/
│       ├── env.js               # Config de ambiente (API_BASE_URL)
│       ├── app.js               # App principal (init, render, theme)
│       ├── router.js            # Router SPA (hash-based)
│       ├── utils/
│       │   ├── config.js        # Constantes (APP_NAME, STATUS_COLORS, etc.)
│       │   ├── storage.js       # localStorage wrapper (get/set/remove)
│       │   ├── utils.js         # Helpers (escapeHtml, formatDate, etc.)
│       │   ├── api.js           # Serviço HTTP (get/post/put/delete)
│       │   ├── icons.js         # SVG Icons (Heroicons-style)
│       │   └── geocoding.js     # Autocomplete de cidades (Nominatim)
│       ├── components/
│       │   ├── Navbar.js        # Top navbar + user dropdown + notif dropdown
│       │   ├── Sidebar.js       # Sidebar com grupos e colapso
│       │   ├── Modal.js         # Modal + formulários + confirmação
│       │   ├── Toast.js         # Toast notifications
│       │   ├── Table.js         # Tabela paginada
│       │   └── Card.js          # Card de estatística
│       ├── pages/               # Cada página é um objeto global
│       │   ├── dashboard.js     # Dashboard com gráficos Chart.js
│       │   ├── companies.js     # CRUD Empresas
│       │   ├── drivers.js       # CRUD Motoristas
│       │   ├── vehicles.js      # CRUD Veículos
│       │   ├── routes.js        # CRUD Rotas
│       │   ├── loads.js         # CRUD Cargas
│       │   ├── matching.js      # Matching inteligente
│       │   ├── chat.js          # Chat em tempo real
│       │   ├── documents.js     # Upload/download documentos
│       │   ├── reviews.js       # Avaliações
│       │   ├── freights.js      # Histórico de fretes
│       │   ├── notifications.js # Notificações
│       │   ├── maps.js          # Mapa interativo (Leaflet)
│       │   ├── login.js         # Login/Registro
│       │   ├── landing.js       # Landing page (visitantes)
│       │   ├── profile.js       # Perfil do usuário
│       │   ├── settings.js      # Configurações (tema, idioma, logout)
│       │   └── admin-users.js   # Admin: gerenciar usuários
│       └── i18n/
│           ├── i18n.js          # Motor de tradução
│           ├── pt-BR.js         # Traduções português
│           └── en.js            # Translations english
```

---

## 4. Páginas (Pages)

Cada página é um objeto JavaScript global com a estrutura:

```javascript
const NomePage = {
  // Renderiza o HTML da página (pode ser async)
  async render(params) { return "<html>"; },
  
  // Hook chamado após o HTML ser inserido no DOM (opcional)
  afterRender() { /* init charts, event listeners, etc. */ },
  
  // Métodos auxiliares...
};
```

### 4.1 Dashboard (`dashboard.js`)

**Funcionalidades:**
- 6 cards de estatísticas (Empresas Ativas, Motoristas Disponíveis, Cargas Disponíveis, Rotas Ativas, Matches Pendentes, Entregas)
- Gráfico de barras (Chart.js): Status das Cargas
- Gráfico doughnut (Chart.js): Distribuição de Usuários por Role
- Ações Rápidas (Nova Carga, Nova Rota, Matching, Chat)
- Atividade Recente (últimos 5 matches)

**APIs chamadas:** `companies`, `drivers`, `loads`, `routes`, `matching`, `/users/admin/all`

### 4.2 Companies (`companies.js`)

CRUD completo de empresas com tabela paginada, modal de formulário, busca.

### 4.3 Drivers (`drivers.js`)

CRUD de motoristas. Tabela com paginação, filtro por disponibilidade.

### 4.4 Vehicles (`vehicles.js`)

CRUD de veículos vinculados a motoristas.

### 4.5 Routes (`routes.js`)

CRUD de rotas com origem/destino, datas, capacidade.

### 4.6 Loads (`loads.js`)

CRUD de cargas com status (pending → available → matched → in_transit → delivered → cancelled).

### 4.7 Matching (`matching.js`)

**Funcionalidades:**
- Aba "Cargas para Motoristas" / "Motoristas para Cargas"
- Filtros avançados (UF origem/destino, peso, data, score mínimo)
- Cards de resultado com score de compatibilidade (0-100)
- Ação "Criar Match"

### 4.8 Chat (`chat.js`)

Chat em tempo real (WebSocket) entre empresa e motorista. Lista de conversas por match.

### 4.9 Documents (`documents.js`)

Upload e download de documentos. Upload para Supabase Storage (bucket `documents`). Download via signed URL.

### 4.10 Reviews (`reviews.js`)

Avaliações entre empresas e motoristas (1-5 estrelas). Estatísticas de avaliação. CRUD de reviews.

### 4.11 Freights (`freights.js`)

Histórico de fretes realizados.

### 4.12 Notifications (`notifications.js`)

Lista de notificações com filtros (todas, não lidas, matches, mensagens, sistema).

### 4.13 Maps (`maps.js`)

Mapa interativo com Leaflet + OpenStreetMap. Marcadores de cidades com clustering.

### 4.14 Login (`login.js`)

Tela de login/registro com split screen:
- **Modo Login:** Email + Senha
- **Modo Cadastro:** Nome + Email + Senha + Tipo de conta (Empresa/Motorista)

**Importante:** Após login bem-sucedido, salva token e redireciona para `#dashboard`.

### 4.15 Landing (`landing.js`)

Landing page para visitantes não autenticados. Seções: Hero, Features, Como Funciona, CTA, Footer.

### 4.16 Profile (`profile.js`)

Perfil do usuário com:
- Avatar (iniciais + cor gerada)
- Dados pessoais (nome, email, telefone, role)
- Botão editar (modal)
- Rating (se houver avaliações)
- Tema escuro toggle
- Botão sair

### 4.17 Settings (`settings.js`)

Configurações separadas:
- Toggle tema claro/escuro (com ícone sol/lua animado)
- Seletor de idioma PT-BR / EN
- Sobre (versão, tipo de conta)
- Botão sair

### 4.18 Admin Users (`admin-users.js`)

Painel administrativo (role `administrador`):
- Tabela com todos os usuários
- Cards de estatísticas (admins, gestores, empresas, motoristas, ativos/inativos)
- Ações: alterar role (select), ativar/desativar (toggle), excluir

---

## 5. Componentes (Components)

### 5.1 Navbar

**Localização:** Topo fixo, `z-30`

**Elementos (da esquerda para direita):**
1. Botão hamburguer (mobile) — abre/fecha sidebar
2. Logo OpenCargo (mobile)
3. Seletor de idioma (🇧🇷/🇺🇸) — dropdown
4. Ícone de notificações (🔔) — **dropdown com últimas 5 notificações**
5. Toggle de tema (🌙/☀️) — com animação spin
6. Avatar do usuário — **dropdown** com nome, email, Perfil, Configurações, Sair

**Métodos:** `toggleLang()`, `setLang()`, `toggleTheme()`, `toggleUserMenu()`, `toggleNotifications()`, `logout()`, `updateNotificationBadge()`

### 5.2 Sidebar

**Localização:** Fixa à esquerda, `z-40`

**Comportamento:**
- Desktop: 16rem (expandidx) / 4rem (colapsado, apenas ícones)
- Mobile: overlay com backdrop
- Grupos colapsáveis (Gestão, Operações, Comunicação, Conta)
- Link "Admin" visível apenas para role `administrador`

**Grupos:**
| Grupo | Itens |
|-------|-------|
| Gestão | Dashboard, Empresas, Motoristas, Veículos |
| Operações | Rotas, Cargas, Matching, Documentos, Histórico |
| Comunicação | Mapa, Chat, Avaliações, Notificações |
| Conta | Admin, Perfil, Configurações |

### 5.3 Modal

**Funcionalidades:**
- `open({ title, body, footer })` — modal customizado
- `openForm({ title, fields, submitText, onSubmit })` — formulário genérico
- `confirm(message, onConfirm, confirmText)` — diálogo de confirmação
- `close()` — fecha com animação

**Comportamento:**
- Fecha ao clicar fora (backdrop + overflow-y-auto)
- Fecha com ESC
- Scroll interno quando conteúdo ultrapassa a tela
- Animações de entrada/saída (scale + opacity)

### 5.4 Toast

Notificações toast no canto superior direito. Métodos: `success()`, `error()`, `info()`, `warning()`. Auto-destroi após 3.5s.

### 5.5 Table

Tabela genérica com `render({ columns, data, actions })`, suporte a paginação via `renderPagination(total, page, limit)`.

### 5.6 Card

Cartão de estatística: `stat({ title, value, icon, color })`.

---

## 6. Sistema de Roteamento

**Hash-based SPA Router** (`router.js`):

```javascript
// Mapeamento pageName → moduleName
const pageMap = {
  dashboard, companies, drivers, vehicles, routes, loads,
  matching, chat, documents, freights, notifications,
  reviews, maps, landing, login, profile, settings, admin-users
};

// Mapeamento moduleName → global object
const globalMap = {
  dashboard: "DashboardPage",
  companies: "CompaniesPage",
  drivers: "DriversPage",
  // ...
  settings: "SettingsPage",
  "admin-users": "AdminUsersPage",
};
```

**Fluxo:**
1. `Router.go(page)` → mostra skeleton loading
2. `_loadPage(page)` → busca no `globalMap` o nome do objeto
3. Procura em `window[globalName]` ou via `(0, eval)(globalName)`
4. Chama `pageModule.render()` → insere HTML em `#main-content`
5. Se existir, chama `pageModule.afterRender()`

---

## 7. Sistema de Internacionalização (i18n)

**Engine:** Objeto `I18n` com função global `__(key)`.

```javascript
// Uso
__( "nav.dashboard" )        // → "Dashboard"
__( "message.welcome" )      // → "Bem-vindo ao OpenCargo!"
__( "landing.hero.title" )   // → "Reduza viagens vazias e"
```

**Estrutura de chaves (mais de 400 chaves por idioma):**
- `nav.*` — Sidebar e navegação
- `page.*` — Títulos e descrições de páginas
- `action.*` — Botões e ações
- `label.*` — Labels de formulário
- `status.*` — Status de entidades
- `message.*` — Toasts, erros, feedback
- `auth.*` — Login e registro
- `role.*` — Roles (admin, manager, company, driver + pt-BR)
- `landing.*` — Landing page
- `dashboard.*` — Dashboard
- `review.*` — Avaliações
- `match.*` — Matching
- `admin.*` — Admin
- `error.*` — Erros
- `theme.*` — Temas
- `lang.*` — Idioma

**Idiomas:** `pt-BR` (padrão) e `en`.

---

## 8. Serviço de API

**Objeto `Api`** com métodos:
- `get(endpoint)` → fetch GET com auto-unwrap de respostas paginadas `{ data, total }`
- `post(endpoint, data)` → fetch POST
- `put(endpoint, id, data)` → fetch PUT
- `delete(endpoint, id)` → fetch DELETE

**Configuração:** `CONFIG.API_BASE_URL` definido em `env.js`

**Produção:** `https://opencargo-production.up.railway.app/api`

---

## 9. Fluxo de Autenticação

### Login
1. Usuário preenche email + senha no formulário (`LoginPage`)
2. `POST /api/auth/login` → recebe `{ token, user }`
3. Salva token e user no `Storage` (localStorage)
4. Redireciona para `#dashboard` chamando `App.initialize()`

### Registro
1. Usuário preenche nome + email + senha + tipo de conta
2. `POST /api/auth/register` → recebe `{ token, user }`
3. Salva token e user no `Storage`
4. Redireciona para `#dashboard`

### Verificação de token
- `App._validateToken()` → `GET /api/auth/me` com token
- Se inválido, limpa storage e volta para landing page

### Roles
- `administrador` — Acesso total, painel admin
- `gestor` — Acesso intermediário
- `empresa` — Cadastra cargas, vê motoristas, matching
- `motorista` — Cadastra rotas/veículos, vê cargas, matching

---

## 10. Endpoints da API

| Grupo | Endpoints |
|-------|-----------|
| Health | `GET /api/health` |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Users | `GET /api/users`, `GET /api/users/:id`, `PATCH /api/users/:id`, `GET /api/users/admin/all`, `PATCH /api/users/:id/admin`, `DELETE /api/users/:id/admin` |
| Companies | CRUD `/api/companies` |
| Drivers | CRUD `/api/drivers`, `GET /api/drivers/available` |
| Vehicles | CRUD `/api/vehicles` |
| Routes | CRUD `/api/routes`, `GET /api/routes/active`, `GET /api/routes/return` |
| Loads | CRUD `/api/loads`, `GET /api/loads/available` |
| Matching | `GET /api/matching`, `GET /api/matching/search`, `GET /api/matching/loads-for-driver/:id`, `GET /api/matching/drivers-for-load/:id`, `POST /api/matching`, `PATCH /api/matching/:id` |
| Chat | `POST /api/chat/messages`, `GET /api/chat/messages/:matchId`, `WS /api/chat/ws` |
| Reviews | CRUD `/api/reviews`, `GET /api/reviews/stats/:userId` |
| Notifications | `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `POST /api/notifications/read-all` |
| Documents | `POST /api/documents/upload`, `GET /api/documents`, `GET /api/documents/:id/download`, `DELETE /api/documents/:id` |
| Maps | `GET /api/maps/geocode`, `GET /api/maps/route` |

---

## 11. Regras de Negócio Importantes

### Usuários
- Admin pode ver/gerenciar todos os usuários
- Empresa vê apenas seus próprios dados
- Motorista vê apenas seus próprios dados
- Role armazenada em português: `administrador`, `gestor`, `empresa`, `motorista`

### Cargas
- Status: `pending` → `available` → `matched` → `in_transit` → `delivered` / `cancelled`
- Apenas empresa pode criar/editar suas cargas
- Motoristas veem cargas disponíveis (`available`)

### Matching
- Score de compatibilidade (0-100) baseado em: alinhamento de cidades (50pts), peso (20pts), volume (10pts), datas (10pts), tipo (10pts)
- Apenas usuários envolvidos no match podem ver detalhes

### Documentos
- Upload via multipart form-data
- Armazenamento: Supabase Storage (produção) ou local (dev)
- Download via signed URL (válida por 1h)

### Avaliações
- Score de 1 a 5 estrelas
- Apenas participantes do match podem avaliar
- Não é possível avaliar o mesmo match duas vezes

---

## 12. Cores e Ícones

### Paleta de Cores

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `primary` | Azul #2563eb | Azul claro #b3d0ff | Botões, links, elementos ativos |
| `success` | Verde #22c55e | Verde #22c55e | Status positivo |
| `warning` | Amarelo #f59e0b | Amarelo #f59e0b | Status pendente |
| `destructive` | Vermelho #ef4444 | Vermelho #ef4444 | Erro, exclusão |
| `background` | Cinza claro #f5f6fa | Quase preto #0e0f17 | Fundo da página |
| `card` | Branco #ffffff | Cinza escuro #16171d | Cards, containers |
| `sidebar` | Branco | Preto azulado #0c0d15 | Sidebar |

### Ícones

Sistema de ícones SVG estilo **Heroicons** (outline, 24x24, stroke-width=2). Objeto `Icons` com mais de 40 ícones disponíveis:

```javascript
Icons.package({ class: 'w-5 h-5' })    // 📦 Carga
Icons.route({ class: 'w-5 h-5' })       // 🛣️ Rota
Icons.truck({ class: 'w-5 h-5' })       // 🚛 Caminhão
Icons.chat({ class: 'w-5 h-5' })        // 💬 Chat
Icons.bell({ class: 'w-5 h-5' })        // 🔔 Notificação
Icons.link({ class: 'w-5 h-5' })        // 🔗 Match
Icons.user({ class: 'w-5 h-5' })        // 👤 Usuário
Icons.building({ class: 'w-5 h-5' })    // 🏢 Empresa
Icons.map({ class: 'w-5 h-5' })         // 🗺️ Mapa
Icons.star({ class: 'w-5 h-5' })        // ⭐ Avaliação
Icons.settings({ class: 'w-5 h-5' })    // ⚙️ Configurações
// ... e mais 30+
```

Todos os ícones são inline SVGs com classe `icon-hover` (escala ao hover).

---

## Preview URL (Produção)

- **Frontend:** https://opencargo-ivory.vercel.app
- **Backend API:** https://opencargo-production.up.railway.app/api
- **Supabase:** https://irznvnpaetvkuvmdrgoo.supabase.co

---

> Este documento foi gerado para servir de contexto ao Google AI Studio (Gemini) / Google Stitch para recriação da interface do OpenCargo com UI/UX moderna e refinada.
>
> **Última atualização:** Julho 2026
