# Changelog

Todas as alterações notáveis no OpenCargo serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.3.4] — 2026-07-09

### Corrigido

- **Dashboard, Matching, Chat**: páginas não carregavam devido a `Api.get("matches")` e `Api.get("messages")` — endpoints inexistentes no backend. Agora usam `Api.get("matching")` e `Api.get("chat/messages/:matchId")` com fallback para array vazio
- **Profile, Settings**: páginas não carregavam — `router.js` não tinha `"profile"` e `"settings"` no `globalMap`. Agora mapeiam para `ProfilePage`
- **Veículos**: coluna `Status` exibia "undefined" — coluna `status` adicionada na tabela `vehicles` no SQLite, PostgreSQL e scripts SQL
- **Cargas**: coluna `Empresa` vazia — consulta `GET /api/loads` agora faz `LEFT JOIN` com `companies` para retornar `company_name`

### Adicionado

- **Tema escuro**: botão de alternância (lua/sol) com animação `themeSpin` 360° + spring
  - Navbar (usuários logados)
  - Landing page (visitantes)
  - Login/Registro
  - Offline (fallback offline)
  - Perfil (já existia)
- **Persistência**: preferência de tema salva no `localStorage` em todas as páginas
- **Seletor robusto**: botão de tema usa `data-toggle-theme` em vez de `[onclick*="toggleTheme"]`
- **Evento `animationend`**: substitui `setTimeout` para remover classe de animação — adaptável à duração do CSS

### Alterado

- **`loads/routes.js`**: JOIN com `companies` adicionado nas queries `GET /` e `GET /available`
- **`vehicles/routes.js`**: campo `status` adicionado no schema Zod, INSERT e UPDATE
- **`database.js`, `database-pg.js`**, **`supabase-setup.sql`**, **`init.sql`**: coluna `status` adicionada na tabela `vehicles`
- **`router.js`**: `"profile": "ProfilePage"` e `"settings": "ProfilePage"` adicionados ao `globalMap`
- **`Navbar.toggleTheme()`**: seletor `[onclick*="toggleTheme"]` → `[data-toggle-theme]`, animação usa `animationend`

---

## [0.3.3] — 2026-07-08

### Adicionado

- Configuração Railway + env vars para Supabase Auth

### Corrigido

- `rootDirectory` removido do `vercel.json` (não suportado), config movido para `frontend/`
- Teste E2E de cadastro

---

## [0.3.2] — 2026-07-07

### Corrigido

- `DO block` que dropa constraint `users_role_check` movido para depois do `CREATE TABLE users`

---

## [0.3.1] — 2026-07-06

### Adicionado

- Migração completa para **Supabase Auth**
  - Schema `REFERENCES auth.users`
  - Auth service dual-mode (Supabase / JWT próprio)
  - Seed via Admin API
- Efeitos `icon-lift`, `icon-rotate`, `icon-scale`, `icon-pulse` nas ações rápidas do dashboard
- Barra de progresso de scroll abaixo da navbar
- Hover animations nos ícones SVG

### Alterado

- Todos os emojis substituídos por ícones SVG (Heroicons) em páginas e componentes
- Documentação atualizada: Supabase, Railway, novas roles, paginação

---

## [0.3.0] — 2026-07-05

### Adicionado

- Migração PostgreSQL + Supabase RLS + paginação
- **Roles**: administrador, gestor, empresa, motorista
- Efeito `glass-card` no dashboard, matching e componente Card
- Sistema de avaliações (reviews)
- Tema escuro (dark theme)
- Sidebar fixa com sub-menus
- Histórico de fretes (freights)
- Upload de documentos
- Internacionalização (i18n — pt-BR, en)

### Técnico

- Paginação em todas as listas da API (`data, total, page, limit, totalPages`)
- Row Level Security (RLS) no Supabase com políticas por role
- Suporte a SQLite + PostgreSQL com detecção automática

---

## [0.2.0] — 2026-06-20

### Adicionado

- Chat entre empresa e motorista via WebSocket
- Mapa com Leaflet + OpenStreetMap (dark mode)
- Notificações em tempo real via WebSocket
- Clustering de marcadores (Leaflet.markercluster)
- Geocoding com Nominatim (autocomplete de cidades)
- Rotas no mapa com OSRM
- Deploy config: Render (backend + PostgreSQL blueprint)
- Root `package.json` com `npm run dev` para iniciar backend + frontend juntos

### Melhorado

- Dashboard com métricas consolidadas
- Configuração CORS multi-origem

---

## [0.1.1] — 2026-06-10

### Adicionado

- Login/registro com integração real à API
- Página de perfil editável com `PATCH /api/users/:id`
- Landing page para visitantes não autenticados
- Animações scroll-reveal com IntersectionObserver
- Página offline com Service Worker (PWA)

### Corrigido

- Router usa `(0, eval)` (indirect eval) para encontrar páginas definidas com `const`
- Erro de syntax no `dashboard.js` (extra `}`)
- `rootDirectory` removido do `vercel.json` (opção não suportada)
- Campo `phone` adicionado na query de `/api/auth/me`

---

## [0.1.0] — 2026-06-01

### Adicionado

- MVP — Frete de Retorno
- CRUD completo: Empresas, Motoristas, Veículos, Rotas, Cargas
- Motor de Matching (por cidades com score, 0-100)
- Dashboard básico com cards de estatísticas
- Autenticação JWT + bcrypt (registro e login)
- Suporte a dados mockados (JSON local) quando API está indisponível
- Deploy config para Vercel (frontend estático)
- Docker Compose (backend + frontend)
- Documentação: API, Deploy, Arquitetura, Banco de Dados
- CI/CD com GitHub Actions
- Seed script com dados de exemplo
- Suporte a PostgreSQL + SQLite com detecção automática

### Técnico

- **Backend**: Node.js + Fastify + Zod
- **Frontend**: HTML + Vanilla JS + Tailwind CSS CDN + Alpine.js CDN
- **Banco**: SQLite (dev) / PostgreSQL (prod) com camada de abstração
- **Mapa**: Leaflet + OpenStreetMap
- **Testes**: Node.js Test Runner

---

[0.3.4]: https://github.com/charaodaniel/opencargo/compare/2d12455...8ab0266
[0.3.3]: https://github.com/charaodaniel/opencargo/compare/62cced7...2d12455
[0.3.2]: https://github.com/charaodaniel/opencargo/compare/f2b5d3a...62cced7
[0.3.1]: https://github.com/charaodaniel/opencargo/compare/5c10edd...f2b5d3a
[0.3.0]: https://github.com/charaodaniel/opencargo/compare/dd83a27...5c10edd
[0.2.0]: https://github.com/charaodaniel/opencargo/compare/37d4063...dd83a27
[0.1.1]: https://github.com/charaodaniel/opencargo/compare/73c73f6...37d4063
[0.1.0]: https://github.com/charaodaniel/opencargo/commits/73c73f6
