/**
 * ── OpenCargo — Documentation Page ────────────────────
 * Página de documentação do sistema, acessível diretamente
 * na plataforma. Exibe guias, referência da API e links
 * para os arquivos de documentação.
 */

const DocsPage = {
  /** Seção ativa */
  _section: "overview",

  async render() {
    if (!this._section) this._section = "overview";

    return `
      <div class="fade-in max-w-4xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Documentação</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Guia completo do sistema OpenCargo
          </p>
        </div>

        <div class="flex flex-col lg:flex-row gap-8">
          <!-- Sidebar de navegação -->
          <nav class="lg:w-56 shrink-0">
            <div class="space-y-1 sticky top-24">
              ${this._navItems.map(item => `
                <button onclick="DocsPage.goToSection('${item.id}')"
                  class="w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    this._section === item.id
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  }">
                  <span class="mr-2">${item.icon}</span>
                  ${item.label}
                </button>
              `).join("")}
            </div>
          </nav>

          <!-- Conteúdo -->
          <div class="flex-1 min-w-0">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
              ${this._renderSection()}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  _navItems: [
    { id: "overview", icon: "📋", label: "Visão Geral" },
    { id: "quickstart", icon: "🚀", label: "Quick Start" },
    { id: "features", icon: "✨", label: "Funcionalidades" },
    { id: "roles", icon: "👥", label: "Perfis de Acesso" },
    { id: "pages", icon: "📄", label: "Páginas do Sistema" },
    { id: "api", icon: "🔌", label: "API Reference" },
    { id: "deploy", icon: "🌐", label: "Deploy" },
    { id: "architecture", icon: "🏗️", label: "Arquitetura" },
  ],

  _renderSection() {
    switch (this._section) {
      case "overview": return this._renderOverview();
      case "quickstart": return this._renderQuickStart();
      case "features": return this._renderFeatures();
      case "roles": return this._renderRoles();
      case "pages": return this._renderPages();
      case "api": return this._renderApi();
      case "deploy": return this._renderDeploy();
      case "architecture": return this._renderArchitecture();
      default: return this._renderOverview();
    }
  },

  _renderOverview() {
    return `
      <div class="prose dark:prose-invert max-w-none">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">📋 Visão Geral</h2>

        <p class="text-gray-600 dark:text-gray-400 mb-4">
          O <strong>OpenCargo</strong> é uma plataforma <strong>open source</strong> para logística colaborativa
          que conecta empresas que precisam transportar cargas com motoristas que já realizarão
          determinada rota e possuem capacidade ociosa — especialmente no <strong>frete de retorno (backhaul)</strong>.
        </p>

        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">🎯 Problema</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Milhares de caminhões percorrem diariamente grandes distâncias <strong>vazios</strong> ou parcialmente
          carregados, gerando desperdício de combustível, aumento do custo do frete e maior emissão de CO₂.
        </p>

        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">💡 Solução</h3>
        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 font-mono text-sm text-gray-600 dark:text-gray-400">
          <div class="flex items-center space-x-2 mb-2">
            <span class="w-3 h-3 rounded-full bg-green-500"></span>
            <span>São Paulo ──(carregado)──▶ Porto Alegre</span>
          </div>
          <div class="flex items-center space-x-2 mb-2 ml-8">
            <span class="text-gray-400">│</span>
            <span class="text-gray-400">(entrega realizada)</span>
          </div>
          <div class="flex items-center space-x-2 mb-2 ml-8">
            <span class="text-gray-400">▼</span>
          </div>
          <div class="flex items-center space-x-2 mb-2 ml-8">
            <span class="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span>Retorno vazio → Sistema busca cargas → Retorno carregado!</span>
          </div>
        </div>

        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">🛠 Stack</h3>
        <div class="grid grid-cols-2 gap-3">
          ${[
            { label: "Backend", value: "Node.js 22+ · Fastify 5 · Zod" },
            { label: "Frontend", value: "HTML5 · Tailwind CSS · Vanilla JS" },
            { label: "Database", value: "SQLite (dev) · PostgreSQL (prod)" },
            { label: "Auth", value: "JWT + bcrypt · Supabase Auth" },
            { label: "Mapas", value: "Leaflet · OSM · Nominatim · OSRM" },
            { label: "Infra", value: "Docker · Vercel · Railway · Supabase" },
          ].map(s => `
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">${s.label}</p>
              <p class="text-sm text-gray-900 dark:text-white mt-0.5">${s.value}</p>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  },

  _renderQuickStart() {
    return `
      <div class="prose dark:prose-invert max-w-none">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">🚀 Quick Start</h2>

        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2">Pré-requisitos</h3>
        <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4">
          <li>✅ Node.js >= 22</li>
          <li>✅ npm</li>
        </ul>

        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2">Setup</h3>
        <div class="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 font-mono text-sm text-green-400 overflow-x-auto">
          <div><span class="text-gray-500"># Clone o repositório</span></div>
          <div>git clone https://github.com/charaodaniel/opencargo.git</div>
          <div>cd opencargo</div>
          <div class="mt-2"><span class="text-gray-500"># Setup automático</span></div>
          <div>npm run setup</div>
          <div class="mt-2"><span class="text-gray-500"># Inicie backend + frontend</span></div>
          <div>npm run dev</div>
          <div class="mt-2"><span class="text-gray-500"># Popule com dados de exemplo</span></div>
          <div>npm run seed</div>
        </div>

        <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">
          Backend: <code class="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">http://localhost:3000</code>
          · Frontend: <code class="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">http://localhost:5173</code>
        </p>

        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-2">Login padrão (seed)</h3>
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
          <p class="text-blue-700 dark:text-blue-300"><strong>Email:</strong> daniel.kokynhw@gmail.com</p>
          <p class="text-blue-700 dark:text-blue-300 mt-1"><strong>Senha:</strong> Dcm02061994@</p>
          <p class="text-blue-600 dark:text-blue-400 mt-2 text-xs">* Role: administrador</p>
        </div>
      </div>
    `;
  },

  _renderFeatures() {
    return `
      <div class="prose dark:prose-invert max-w-none">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">✨ Funcionalidades</h2>

        <div class="space-y-6">
          ${[
            {
              icon: "📦",
              title: "Cadastro de Cargas",
              desc: "Empresas podem cadastrar cargas informando origem, destino, peso, volume, tipo e datas. Status tracking: pendente → disponível → compatível → em trânsito → entregue.",
            },
            {
              icon: "🔗",
              title: "Matching Inteligente",
              desc: "Algoritmo de score (0-100) que encontra motoristas com rotas compatíveis para frete de retorno. Critérios: alinhamento de cidades, peso, volume, datas e tipo de veículo.",
            },
            {
              icon: "🏢",
              title: "Painel da Empresa",
              desc: "Dashboard exclusivo para empresas com métricas de cargas, matches recentes, gráfico de distribuição por status e ações rápidas.",
            },
            {
              icon: "📋",
              title: "Perfil do Usuário",
              desc: "Página dedicada com avatar, informações pessoais, avaliações recebidas e edição de perfil. Separado das configurações do sistema.",
            },
            {
              icon: "💬",
              title: "Chat em Tempo Real",
              desc: "Comunicação entre empresa e motorista via WebSocket com persistência de mensagens e notificações de novas mensagens.",
            },
            {
              icon: "🗺️",
              title: "Mapa Interativo",
              desc: "Visualização de cargas, rotas e cidades no mapa Leaflet com OpenStreetMap, clustering de marcadores e dark mode.",
            },
            {
              icon: "📡",
              title: "Suporte Offline",
              desc: "Ações são enfileiradas no localStorage quando sem internet. Ao voltar ao online, sincronizam automaticamente com notificação push de resultado.",
            },
            {
              icon: "🕵️",
              title: "Auditoria e Alertas",
              desc: "Logs detalhados de atividade com gráficos, filtros avançados, exportação CSV/PNG/SVG e detecção de atividades suspeitas.",
            },
            {
              icon: "🔐",
              title: "Segurança",
              desc: "Autenticação JWT, controle de acesso por role (admin, gestor, empresa, motorista), rate limiting e proteção de dados.",
            },
            {
              icon: "🌍",
              title: "Multi-Idioma",
              desc: "Suporte a português (pt-BR) e inglês (en) com alternância dinâmica sem recarregar a página.",
            },
          ].map(f => `
            <div class="flex items-start space-x-4">
              <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-lg shrink-0">
                ${f.icon}
              </div>
              <div>
                <h4 class="font-semibold text-gray-900 dark:text-white">${f.title}</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${f.desc}</p>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  },

  _renderRoles() {
    return `
      <div class="prose dark:prose-invert max-w-none">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">👥 Perfis de Acesso</h2>

        <div class="space-y-4">
          ${[
            { role: "Administrador", color: "purple", desc: "Acesso total ao sistema. Gerencia usuários, empresas, motoristas, veículos e todas as configurações.", accesses: ["Dashboard", "Empresas", "Motoristas", "Veículos", "Rotas", "Cargas", "Matching", "Chat", "Mapas", "Notificações", "Avaliações", "Auditoria", "Alertas", "Admin Usuários", "Logs", "Documentos", "Configurações"] },
            { role: "Gestor", color: "blue", desc: "Acesso administrativo limitado. Pode gerenciar recursos e visualizar relatórios.", accesses: ["Dashboard", "Empresas", "Motoristas", "Veículos", "Rotas", "Cargas", "Matching", "Chat", "Mapas", "Notificações", "Avaliações", "Logs", "Documentos", "Configurações"] },
            { role: "Empresa", color: "green", desc: "Pode cadastrar cargas, ver matching, conversar com motoristas e acessar o painel da empresa.", accesses: ["Painel da Empresa", "Cargas", "Matching", "Chat", "Mapas", "Notificações", "Avaliações", "Documentos", "Perfil", "Configurações"] },
            { role: "Motorista", color: "amber", desc: "Pode cadastrar rotas, gerenciar veículos, ver matching e aceitar cargas.", accesses: ["Rotas", "Veículos", "Matching", "Chat", "Mapas", "Notificações", "Avaliações", "Documentos", "Perfil", "Configurações"] },
          ].map(r => `
            <div class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div class="bg-${r.color}-50 dark:bg-${r.color}-900/20 px-5 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 class="font-semibold text-${r.color}-700 dark:text-${r.color}-300">${r.role}</h3>
              </div>
              <div class="p-4">
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">${r.desc}</p>
                <div class="flex flex-wrap gap-1.5">
                  ${r.accesses.map(a => `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">${a}</span>`).join("")}
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  },

  _renderPages() {
    return `
      <div class="prose dark:prose-invert max-w-none">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">📄 Páginas do Sistema</h2>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400 uppercase text-xs">Página</th>
                <th class="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400 uppercase text-xs">Descrição</th>
                <th class="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400 uppercase text-xs">Acesso</th>
              </tr>
            </thead>
            <tbody>
              ${[
                ["dashboard", "Dashboard principal com stats e gráficos", "Todos"],
                ["company", "Painel da Empresa com métricas e cargas", "Empresa"],
                ["companies", "CRUD de empresas transportadoras", "Admin/Gestor"],
                ["drivers", "CRUD de motoristas", "Admin/Gestor"],
                ["vehicles", "CRUD de veículos", "Admin/Gestor/Motorista"],
                ["routes", "CRUD de rotas de viagem", "Admin/Gestor/Motorista"],
                ["loads", "CRUD de cargas para transporte", "Admin/Gestor/Empresa"],
                ["matching", "Motor de matching entre cargas e rotas", "Todos"],
                ["chat", "Chat em tempo real", "Todos"],
                ["maps", "Mapa interativo", "Todos"],
                ["reviews", "Avaliações entre as partes", "Todos"],
                ["freights", "Histórico de fretes realizados", "Todos"],
                ["notifications", "Central de notificações", "Todos"],
                ["documents", "Gestão de documentos", "Todos"],
                ["logs", "Histórico de atividades", "Admin/Gestor"],
                ["audit", "Auditoria com gráficos e estatísticas", "Admin"],
                ["alerts", "Alertas de segurança", "Admin"],
                ["admin-users", "Administração de usuários", "Admin"],
                ["profile", "Perfil do usuário", "Todos"],
                ["settings", "Configurações do sistema", "Todos"],
                ["docs", "Documentação do sistema", "Todos"],
              ].map(([page, desc, access]) => `
                <tr class="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td class="py-2.5 px-2">
                    <button onclick="Router.go('${page}')" class="text-blue-600 dark:text-blue-400 hover:underline font-medium">${page}</button>
                  </td>
                  <td class="py-2.5 px-2 text-gray-600 dark:text-gray-400">${desc}</td>
                  <td class="py-2.5 px-2">
                    <span class="text-xs ${
                      access === "Todos" ? "text-green-600 dark:text-green-400" :
                      access.includes("Admin") ? "text-purple-600 dark:text-purple-400" :
                      "text-blue-600 dark:text-blue-400"
                    }">${access}</span>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  _renderApi() {
    return `
      <div class="prose dark:prose-invert max-w-none">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">🔌 API Reference</h2>

        <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <p class="text-sm text-yellow-700 dark:text-yellow-300">
            <strong>Base URL:</strong> <code class="bg-yellow-100 dark:bg-yellow-900/40 px-2 py-0.5 rounded">http://localhost:3000/api</code>
          </p>
          <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            <strong>Auth:</strong> Header <code class="bg-yellow-100 dark:bg-yellow-900/40 px-2 py-0.5 rounded">Authorization: Bearer &lt;token&gt;</code>
          </p>
        </div>

        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">Autenticação</h3>
        ${this._apiTable([
          ["POST /auth/register", "Registrar novo usuário", "❌"],
          ["POST /auth/login", "Login → retorna JWT", "❌"],
          ["GET /auth/me", "Dados do usuário logado", "🔐"],
          ["PATCH /auth/password", "Alterar senha", "🔐"],
        ])}

        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">Companies</h3>
        ${this._apiTable([
          ["POST /companies", "Cadastrar empresa", "🔐"],
          ["GET /companies", "Listar empresas", "🔐"],
          ["GET /companies/me", "Empresa do usuário logado", "🔐"],
          ["GET /companies/:id", "Buscar empresa", "🔐"],
          ["PATCH /companies/:id", "Atualizar empresa", "🔐"],
        ])}

        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">Loads</h3>
        ${this._apiTable([
          ["POST /loads", "Cadastrar carga", "🔐"],
          ["GET /loads", "Listar cargas (paginado)", "🔐"],
          ["GET /loads/available", "Cargas disponíveis", "🔐"],
          ["GET /loads/nearby", "Cargas próximas (GPS/cidade)", "🔐"],
          ["GET /loads/:id", "Buscar carga", "🔐"],
          ["PATCH /loads/:id", "Atualizar carga", "🔐"],
          ["DELETE /loads/:id", "Remover carga", "🔐"],
        ])}

        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">Matching</h3>
        ${this._apiTable([
          ["GET /matching/search", "Busca com filtros avançados", "🔐"],
          ["GET /matching/filters", "Opções de filtro", "🔐"],
          ["POST /matching", "Criar match", "🔐"],
          ["GET /matching", "Listar matches", "🔐"],
          ["PATCH /matching/:id", "Atualizar status", "🔐"],
        ])}

        <p class="text-xs text-gray-400 dark:text-gray-500 mt-6">
          Documentação completa: <a href="docs/API.md" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">docs/API.md</a>
        </p>
      </div>
    `;
  },

  _apiTable(rows) {
    return `
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th class="text-left py-2 pr-4 font-medium text-gray-500 dark:text-gray-400 uppercase text-xs">Endpoint</th>
              <th class="text-left py-2 pr-4 font-medium text-gray-500 dark:text-gray-400 uppercase text-xs">Descrição</th>
              <th class="text-left py-2 font-medium text-gray-500 dark:text-gray-400 uppercase text-xs">Auth</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(([endpoint, desc, auth]) => `
              <tr class="border-b border-gray-100 dark:border-gray-700/50">
                <td class="py-2 pr-4"><code class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-blue-600 dark:text-blue-400">${endpoint}</code></td>
                <td class="py-2 pr-4 text-gray-600 dark:text-gray-400">${desc}</td>
                <td class="py-2 text-xs">${auth === "❌" ? "❌" : "🔐"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  },

  _renderDeploy() {
    return `
      <div class="prose dark:prose-invert max-w-none">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">🌐 Deploy</h2>

        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2">🐳 Docker</h3>
        <div class="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 font-mono text-sm text-green-400 overflow-x-auto mb-4">
          <div>docker compose up --build</div>
        </div>

        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2">⚡ Vercel (Frontend — Free Tier)</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          O frontend é uma SPA estática que funciona no free tier da Vercel sem build step.
        </p>
        <div class="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 font-mono text-sm text-green-400 overflow-x-auto mb-4">
          <div><span class="text-gray-500"># A Vercel detecta automaticamente o vercel.json</span></div>
          <div><span class="text-gray-500"># rootDirectory: \"frontend\"</span></div>
        </div>

        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2">🛤️ Railway (Backend)</h3>
        <ol class="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4 list-decimal">
          <li>Conecte o repositório no Railway</li>
          <li>Root directory: <code class="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">backend</code></li>
          <li>Configure as variáveis de ambiente</li>
        </ol>

        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2">🗄️ Supabase (PostgreSQL)</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Banco PostgreSQL gerenciado com RLS, índices e trigger de sincronização de usuários.
        </p>

        <p class="text-xs text-gray-400 dark:text-gray-500 mt-6">
          Guia completo: <a href="docs/DEPLOY.md" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">docs/DEPLOY.md</a>
        </p>
      </div>
    `;
  },

  _renderArchitecture() {
    return `
      <div class="prose dark:prose-invert max-w-none">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">🏗️ Arquitetura</h2>

        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 font-mono text-xs text-gray-600 dark:text-gray-400 overflow-x-auto mb-6">
          <pre>
              Frontend (SPA)
              HTML + Tailwind + Vanilla JS
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
  (file.db)              (Supabase / self-hosted)
          </pre>
        </div>

        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">📁 Estrutura de Diretórios</h3>
        <div class="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 font-mono text-xs text-green-400 overflow-x-auto">
          <pre>
OpenCargo/
├── backend/          # API REST (Node.js + Fastify)
│   ├── src/          # Módulos (auth, users, companies, ...)
│   ├── tests/        # Testes (node:test)
│   └── scripts/      # Seed de dados
├── frontend/         # Interface web (SPA)
│   ├── index.html
│   ├── sw.js         # Service Worker (PWA)
│   ├── manifest.json # PWA manifest
│   └── assets/
│       ├── js/       # utils/, components/, pages/
│       ├── css/      # style.css
│       └── icons/    # Logos em múltiplos tamanhos
├── docs/             # Documentação
├── docker/           # Dockerfiles
├── database/         # SQL schema
└── scripts/          # Setup shell
          </pre>
        </div>

        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">🔗 Fluxo Principal</h3>
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-700 dark:text-blue-300">
          Empresa → Cadastrar carga → Matching → Motorista aceita → Coleta → Entrega
        </div>
      </div>
    `;
  },

  goToSection(section) {
    this._section = section;
    Router.refresh();
  },
};
