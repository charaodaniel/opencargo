# OpenCargo — Todo List

> Lista completa do que já foi implementado e possíveis melhorias.

---

## ✅ Concluído

### 🏗️ Estrutura e Arquitetura

- [x] Estrutura monorepo (backend + frontend)
- [x] Docker Compose (backend + frontend + nginx)
- [x] Deploy Vercel (frontend SPA estática)
- [x] Deploy Railway (backend)
- [x] Supabase PostgreSQL + RLS
- [x] Suporte a SQLite (dev) e PostgreSQL (prod)
- [x] CI via GitHub Actions
- [x] Script de setup automático (`npm run setup`)

### 🔐 Autenticação e Segurança

- [x] Registro e login com JWT + bcrypt
- [x] Roles: administrador, gestor, empresa, motorista
- [x] Rate limiting nas rotas da API
- [x] Validação com Zod nos endpoints
- [x] Supabase Auth (produção)
- [x] Logs de atividade (`activity_logs`)
- [x] Detecção de atividades suspeitas (login failures, edições em massa)
- [x] Página de alertas de segurança
- [x] Página de auditoria com gráficos e estatísticas
- [x] Validação de CPF/CNPJ
- [x] Senha com validação de força

### 📦 CRUDs Completos

- [x] Empresas (CRUD + ativar/desativar)
- [x] Motoristas (CRUD + listar disponíveis)
- [x] Veículos (CRUD + upload foto + tipos)
- [x] Rotas (CRUD + filtrar ativas)
- [x] Cargas (CRUD + status update + tipos)
- [x] Usuários (admin listar/editar)
- [x] Documentos (upload/download)
- [x] Fretes (histórico + status)
- [x] Avaliações (dar/receber)
- [x] Ordens de Serviço

### 🧠 Matching

- [x] Motor de matching por cidades com score
- [x] Cargas perto de mim (geográfico)
- [x] Filtros avançados (tipo de carga, peso, volume, período)
- [x] Score de compatibilidade visível
- [x] Thresholds configuráveis via env vars

### 💬 Comunicação

- [x] Chat em tempo real (WebSocket)
- [x] Notificações em tempo real (WebSocket)
- [x] Notificações push (Web Notification API)
- [x] Marcar notificações como lidas (individual/todas)
- [x] Badge de notificações não lidas

### 🗺️ Mapas

- [x] Leaflet + OpenStreetMap com dark mode
- [x] MarkerCluster para agrupamento
- [x] Nominatim geocoding (autocomplete cidades)
- [x] OSRM routing (rotas entre cidades)
- [x] Filtros por tipo (rotas ativas, concluídas, cargas, cidades)

### 📊 Dashboard e Páginas

- [x] Dashboard geral com stats + gráficos Chart.js
- [x] Painel da Empresa (dashboard exclusivo para role empresa)
- [x] Página inicial (Landing Page) com hero image e seção BlaBlaCar
- [x] Página de Matching dedicada
- [x] Página de Logs com gráfico de atividade diária
- [x] Página de Auditoria com estatísticas avançadas
- [x] Página de Documentação integrada (in-app)
- [x] Página de Perfil (separada de Configurações)
- [x] Página de Configurações (tema, idioma, senha)
- [x] Tabelas com paginação e exportação CSV
- [x] Filtros de período predefinido (hoje, semana, mês)

### 🎨 UI/UX

- [x] Splash screen animado no carregamento
- [x] Modo escuro (dark mode)
- [x] Design responsivo
- [x] Cards com data-reveal (scroll animation)
- [x] Glass morphism (efeito vidro)
- [x] Toast notifications
- [x] Modal reutilizável (HTML no título fixado)
- [x] Sidebar com agrupamento por role
- [x] Navbar com dropdown de perfil

### 🌐 PWA e Offline

- [x] Service Worker com cache estratégico
- [x] Manifest.json (instalável como app)
- [x] Suporte offline (fila de ações em localStorage)
- [x] Sincronização automática ao voltar ao online
- [x] Badge de ações pendentes na navbar
- [x] Banner de atualização PWA (skipWaiting)
- [x] Ícones PWA (48px a 1024px)

### 🌍 Internacionalização

- [x] i18n completo (pt-BR, en)
- [x] Seletor de idioma na navbar
- [x] Persistência da preferência de idioma

### 🧪 Testes

- [x] 38 testes de API com node:test
- [x] Setup de Playwright para E2E
- [x] Teste de PWA manifest
- [x] Teste de Service Worker

### 📚 Documentação

- [x] README completo com badges
- [x] API.md — referência completa da API REST
- [x] ARCHITECTURE.md — arquitetura do sistema
- [x] DATABASE.md — modelo de dados
- [x] BUSINESS_RULES.md — regras de negócio
- [x] SECURITY.md — autenticação e segurança
- [x] DEPLOY.md — guia de deploy
- [x] ROADMAP.md — roadmap do projeto
- [x] CONTRIBUTING.md — guia para contribuidores
- [x] Página de documentação in-app

### 🛠️ Modo Mock

- [x] API mock com dados de arquivos JSON
- [x] Persistência em memória (POST/PATCH/DELETE via `_mockStore`)
- [x] Conversão automática camelCase → snake_case
- [x] Fallback automático quando API não disponível

---

## 🔄 Em Andamento / Melhorias Planejadas

### 🧪 Testes (Prioridade Alta)

- [ ] Testes E2E com Playwright (login, CRUD, matching)
- [ ] Testes unitários para funções do frontend (Utils, Api, Storage)
- [ ] Testes de acessibilidade
- [ ] Testes de performance (Lighthouse)

### 🚀 Matching — Inteligência (versão 0.4)

- [ ] Matching com distância máxima configurável
- [ ] Desvios permitidos no trajeto (% ou km)
- [ ] Cálculo automático de frete (baseado em distância, peso, volume)
- [ ] Score de compatibilidade avançado (peso × volume × histórico)
- [ ] Sugestão de rotas otimizadas (múltiplas paradas)
- [ ] Cargas compatíveis com veículo específico

### 📊 Relatórios e Exportação

- [ ] Exportar relatórios em PDF
- [ ] Dashboard inteligente por role:
  - Admin: visão geral do sistema
  - Empresa: suas cargas, matches, motoristas
  - Motorista: suas rotas, cargas disponíveis, histórico
- [ ] Gráficos interativos com zoom/hover detalhado
- [ ] Relatório de performance mensal

### 💻 Frontend — Melhorias

- [ ] Loading states esqueletais (skeleton screens)
- [ ] Animações de transição entre páginas
- [ ] Feedback visual em formulários (validação inline)
- [ ] Máscaras de input (telefone, CPF, CNPJ, CEP)
- [ ] Autocomplete de endereço completo (via API dos Correios)
- [ ] Upload de avatar com preview e crop
- [ ] Modo escuro com mais temas (azul, roxo, verde)
- [ ] Acessibilidade (ARIA labels, foco visível, tab order)
- [ ] Melhorar responsividade para mobile (gestos, bottom nav)
- [ ] Virtual scrolling para listas grandes

### 🛡️ Segurança

- [ ] 2FA (autenticação de dois fatores)
- [ ] Recuperação de senha (email)
- [ ] Bloqueio de conta após múltiplas tentativas
- [ ] Logout de todos os dispositivos
- [ ] Auditoria de login (histórico de sessões)
- [ ] Rate limit por usuário (não só por IP)

### 📡 Notificações

- [ ] Notificações push em background (Service Worker)
- [ ] Preferências de notificação por tipo
- [ ] Notificações por email
- [ ] Notificações por WhatsApp (integração)
- [ ] Central de notificações com filtros

### 🔗 Integrações

- [ ] API pública para terceiros (com chave de API)
- [ ] Integração com ERPs (SAP, Oracle, etc.)
- [ ] Integração com Google Maps / Waze
- [ ] Gateway de pagamento (Stripe, PayPal, Mercado Pago)
- [ ] Cooperativas e grupos de transportadores
- [ ] Marketplace de fretes aberto

### 🗺️ Mapas — Melhorias

- [ ] Otimização de rotas com Valhalla
- [ ] Rastreamento em tempo real (GPS)
- [ ] Geofencing (notificar quando entrar/sair de área)
- [ ] Cálculo de pedágio e custo de rota
- [ ] Visualização 3D do terreno

### 📱 Aplicativo Mobile

- [ ] App Android (React Native ou Kotlin)
- [ ] App iOS (React Native ou Swift)
- [ ] Push notifications nativas
- [ ] Câmera para foto de documentos
- [ ] GPS para rastreamento em tempo real
- [ ] Modo offline completo com sincronização

### 🐛 Bugs Conhecidos

- [ ] (Nenhum bug conhecido reportado)

### 🧹 Refatoração

- [ ] Migrar CSS para Tailwind utility classes (remover CSS customizado aos poucos)
- [ ] Componentizar mais partes do frontend
- [ ] Padronizar error handling no frontend
- [ ] Adicionar types (JSDoc) em todas as funções
- [ ] Separar lógica de negócio das páginas (services)
- [ ] Melhorar tratamento de datas (timezone, formatação consistente)

### 🚢 DevOps

- [ ] Adicionar health check endpoint mais robusto
- [ ] Monitoramento com Sentry ou similar
- [ ] CI com testes automatizados + lint
- [ ] Deploy automatizado (Vercel + Railway via GitHub Actions)
- [ ] Backup automático do banco

---

## ⏳ Futuro (Versão 2.0+)

- [ ] Aplicativo mobile nativo completo
- [ ] IA para otimização de cargas (roteirização inteligente)
- [ ] Rastreamento em tempo real com mapa ao vivo
- [ ] Gateway de pagamento integrado
- [ ] Plataforma internacional (mais idiomas)
- [ ] Painel administrativo avançado com BI
- [ ] API pública documentada (OpenAPI/Swagger)
- [ ] Integração com Google Maps / Waze
- [ ] Cooperativas e consórcios
- [ ] Machine Learning para previsão de demanda

---

## 📈 Métricas do Projeto

| Métrica | Valor |
|---------|-------|
| **Páginas Frontend** | 23 |
| **Componentes** | 6 (Modal, Toast, Table, Card, Navbar, Sidebar) |
| **Utils** | 7 (api, storage, utils, config, icons, geocoding, offline-queue) |
| **Endpoints API** | 40+ |
| **Testes** | 38 (backend) + E2E configurado |
| **Idiomas** | 2 (pt-BR, en) |
| **Roles** | 4 (admin, gestor, empresa, motorista) |
| **Commits** | 50+ |
