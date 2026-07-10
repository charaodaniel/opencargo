/**
 * ── OpenCargo — Company Dashboard Page ────────────────
 * Painel exclusivo para empresas visualizarem seus dados:
 * perfil da empresa, cargas, matches recentes, e métricas.
 */

const CompanyDashboardPage = {
  /** Dados da empresa logada */
  _company: null,

  /** Cargas da empresa */
  _companyLoads: [],

  /** Rotas vinculadas */
  _companyRoutes: [],

  /** Matches envolvendo cargas da empresa */
  _companyMatches: [],

  /** Motoristas cadastrados */
  _drivers: [],

  /** Instância do gráfico de status */
  _chart: null,

  /**
   * Renderiza o painel da empresa
   */
  async render() {
    try {
      // 1. Carrega perfil da empresa
      await this._loadCompanyProfile();

      // 2. Carrega dados relacionados em paralelo
      if (this._company?.id) {
        await this._loadRelatedData();
      }
    } catch (err) {
      console.error("Erro ao carregar painel da empresa:", err);
    }

    if (!this._company) {
      return `
        <div class="fade-in text-center py-16">
          <div class="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Empresa não encontrada</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Seu usuário não possui uma empresa vinculada. Entre em contato com o administrador.
          </p>
          <button onclick="Router.go('settings')" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Ir para Configurações
          </button>
        </div>
      `;
    }

    return `
      <div class="fade-in space-y-6">

        <!-- ═══ Company Profile Header ═══ -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-8 text-white relative overflow-hidden">
            <div class="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
            <div class="absolute bottom-0 left-1/4 w-72 h-72 bg-white/5 rounded-full translate-y-1/2"></div>
            <div class="relative flex items-center gap-5">
              <div class="w-16 h-16 rounded-2xl overflow-hidden shrink-0 shadow-lg ring-2 ring-white/30">
                <img src="assets/icons/logo-192.png" alt="OpenCargo" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1 min-w-0">
                <h2 class="text-2xl font-bold truncate">${Utils.escapeHtml(this._company.name)}</h2>
                <p class="text-blue-100 text-sm mt-0.5">${this._company.document ? Utils.escapeHtml(this._company.document) : "CNPJ não informado"}</p>
                <div class="flex flex-wrap items-center gap-3 mt-2 text-sm text-blue-100">
                  ${this._company.city ? `<span>📍 ${Utils.escapeHtml(this._company.city)}/${this._company.state || ""}</span>` : ""}
                  ${this._company.phone ? `<span>📞 ${Utils.escapeHtml(this._company.phone)}</span>` : ""}
                </div>
              </div>
              <span class="shrink-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                this._company.active !== false
                  ? "bg-green-400/20 text-green-100"
                  : "bg-red-400/20 text-red-100"
              }">
                ${this._company.active !== false ? "● Ativa" : "● Inativa"}
              </span>
            </div>
          </div>
        </div>

        <!-- ═══ Stats Grid ═══ -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          ${Card.stat({ title: "Total de Cargas", value: this._companyLoads.length, color: "blue", icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>' })}
          ${Card.stat({ title: "Disponíveis", value: this._companyLoads.filter(l => l.status === "available").length, color: "green", icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' })}
          ${Card.stat({ title: "Em Trânsito", value: this._companyLoads.filter(l => l.status === "in_transit" || l.status === "matched").length, color: "purple", icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>' })}
          ${Card.stat({ title: "Entregues", value: this._companyLoads.filter(l => l.status === "delivered").length, color: "green", icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>' })}
        </div>

        <!-- ═══ Charts & Activity Grid ═══ -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <!-- Status Distribution Chart -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Distribuição por Status
            </h3>
            <div class="relative" style="height: 220px;">
              <canvas id="chart-company-loads-status"></canvas>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Ações Rápidas</h3>
            <div class="space-y-3">
              <button onclick="Router.go('loads')"
                class="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group">
                <div class="flex items-center space-x-3">
                  <div class="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white text-sm">Nova Carga</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Cadastrar uma nova carga para transporte</p>
                  </div>
                  <svg class="w-5 h-5 text-gray-400 ml-auto group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </div>
              </button>

              <button onclick="Router.go('matching')"
                class="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group">
                <div class="flex items-center space-x-3">
                  <div class="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white text-sm">Ver Matching</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Encontre motoristas para suas cargas</p>
                  </div>
                  <svg class="w-5 h-5 text-gray-400 ml-auto group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </div>
              </button>

              <button onclick="Router.go('routes')"
                class="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all group">
                <div class="flex items-center space-x-3">
                  <div class="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white text-sm">Ver Rotas</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Visualize rotas compatíveis</p>
                  </div>
                  <svg class="w-5 h-5 text-gray-400 ml-auto group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </div>
              </button>

              <button onclick="Router.go('chat')"
                class="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group">
                <div class="flex items-center space-x-3">
                  <div class="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white text-sm">Chat</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Converse com motoristas</p>
                  </div>
                  <svg class="w-5 h-5 text-gray-400 ml-auto group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- ═══ Recent Loads ═══ -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Cargas Recentes</h3>
            </div>
            <button onclick="Router.go('loads')" class="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
              Ver todas →
            </button>
          </div>
          ${this._renderLoadsTable()}
        </div>

        <!-- ═══ Recent Matches ═══ -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Matches Recentes</h3>
            </div>
            <button onclick="Router.go('matching')" class="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
              Ver todos →
            </button>
          </div>
          ${this._renderMatchesTable()}
        </div>

      </div>
    `;
  },

  /**
   * Carrega perfil da empresa logada
   */
  async _loadCompanyProfile() {
    try {
      const token = Storage.getToken();
      if (!token || !CONFIG.API_BASE_URL) {
        // Modo mock — carrega do JSON e encontra empresa pelo user_id salvo no storage
        const companies = await Api.get("companies");
        const user = Storage.getUser();
        if (user?.id) {
          this._company = companies.find(c => c.user_id === user.id) || companies[0] || null;
        } else {
          this._company = companies[0] || null;
        }
        return;
      }

      const res = await fetch(`${CONFIG.API_BASE_URL}/companies/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        this._company = await res.json();
      } else {
        // Fallback: filtra companies por user_id no storage
        const companies = await Api.get("companies");
        const user = Storage.getUser();
        if (user?.id) {
          this._company = companies.find(c => c.user_id === user.id) || null;
        }
      }
    } catch (err) {
      console.error("Erro ao carregar perfil da empresa:", err);
      // Fallback: tenta carregar companies e filtrar
      try {
        const companies = await Api.get("companies");
        const user = Storage.getUser();
        if (user?.id) {
          this._company = companies.find(c => c.user_id === user.id) || null;
        }
      } catch {}
    }
  },

  /**
   * Carrega dados relacionados à empresa
   */
  async _loadRelatedData() {
    try {
      const [allLoads, allRoutes, allMatches, drivers] = await Promise.all([
        Api.get("loads"),
        Api.get("routes"),
        Api.get("matching"),
        Api.get("drivers"),
      ]);

      // Filtra pelo company_id da empresa logada
      this._companyLoads = (allLoads || []).filter(l =>
        l.company_id === this._company.id || l.companyId === this._company.id
      );
      this._companyRoutes = (allRoutes || []).filter(r =>
        r.company_id === this._company.id || r.companyId === this._company.id
      );
      this._drivers = drivers || [];

      // Matches que envolvem cargas da empresa
      const loadIds = new Set(this._companyLoads.map(l => l.id || l._id));
      this._companyMatches = (allMatches || []).filter(m =>
        loadIds.has(m.load_id || m.loadId)
      );
    } catch (err) {
      console.error("Erro ao carregar dados relacionados:", err);
    }
  },

  /**
   * Renderiza tabela de cargas recentes
   */
  _renderLoadsTable() {
    const loads = this._companyLoads.slice(0, 10);

    if (loads.length === 0) {
      return `
        <div class="text-center py-12 text-gray-400">
          <svg class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
          <p class="text-sm font-medium">Nenhuma carga cadastrada</p>
          <p class="text-xs mt-1">Clique em "Nova Carga" para começar</p>
        </div>
      `;
    }

    return `
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th class="text-left px-5 py-3 font-medium">Título</th>
              <th class="text-left px-5 py-3 font-medium">Origem</th>
              <th class="text-left px-5 py-3 font-medium">Destino</th>
              <th class="text-left px-5 py-3 font-medium">Peso</th>
              <th class="text-left px-5 py-3 font-medium">Data</th>
              <th class="text-left px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            ${loads.map(l => `
              <tr class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td class="px-5 py-3">
                  <span class="font-medium text-gray-900 dark:text-white">${Utils.escapeHtml(l.title)}</span>
                </td>
                <td class="px-5 py-3 text-gray-600 dark:text-gray-400">${l.origin_city || "-"}/${l.origin_state || "-"}</td>
                <td class="px-5 py-3 text-gray-600 dark:text-gray-400">${l.destination_city || "-"}/${l.destination_state || "-"}</td>
                <td class="px-5 py-3 text-gray-600 dark:text-gray-400">${l.weight_kg ? Utils.formatNumber(l.weight_kg) + " kg" : "-"}</td>
                <td class="px-5 py-3 text-gray-600 dark:text-gray-400">${l.pickup_date ? Utils.formatDate(l.pickup_date) : "-"}</td>
                <td class="px-5 py-3">${Table.statusBadge(l.status)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  },

  /**
   * Renderiza tabela de matches recentes
   */
  _renderMatchesTable() {
    const matches = this._companyMatches.slice(0, 10);

    if (matches.length === 0) {
      return `
        <div class="text-center py-12 text-gray-400">
          <svg class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
          </svg>
          <p class="text-sm font-medium">Nenhum match encontrado</p>
          <p class="text-xs mt-1">Vá para a página de Matching para encontrar motoristas</p>
        </div>
      `;
    }

    return `
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th class="text-left px-5 py-3 font-medium">Carga</th>
              <th class="text-left px-5 py-3 font-medium">Motorista</th>
              <th class="text-left px-5 py-3 font-medium">Score</th>
              <th class="text-left px-5 py-3 font-medium">Data</th>
              <th class="text-left px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            ${matches.map(m => `
              <tr class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td class="px-5 py-3">
                  <span class="font-medium text-gray-900 dark:text-white">${Utils.escapeHtml(m.load_title || `Carga #${(m.load_id || m.loadId || "").slice(0, 8)}`)}</span>
                </td>
                <td class="px-5 py-3 text-gray-600 dark:text-gray-400">${Utils.escapeHtml(m.driver_name || "Motorista")}</td>
                <td class="px-5 py-3">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    m.score >= 75 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    m.score >= 50 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                    "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  }">${m.score || m.score === 0 ? m.score + "%" : "-"}</span>
                </td>
                <td class="px-5 py-3 text-gray-600 dark:text-gray-400">${m.created_at ? Utils.formatDate(m.created_at) : "-"}</td>
                <td class="px-5 py-3">${Table.statusBadge(m.status)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  },

  /**
   * Inicializa gráficos após render
   */
  afterRender() {
    this._initLoadsStatusChart();
  },

  /**
   * Gráfico de pizza: distribuição das cargas por status
   * Destrói instância anterior antes de recriar para evitar
   * vazamento de memória e warning "Canvas is already in use".
   */
  _initLoadsStatusChart() {
    const canvas = document.getElementById("chart-company-loads-status");
    if (!canvas) return;

    // Destrói instância anterior
    if (this._chart) {
      this._chart.destroy();
      this._chart = null;
    }

    const isDark = document.documentElement.classList.contains("dark");
    const textColor = isDark ? "#d1d5db" : "#374151";

    const statusOrder = ["pending", "available", "matched", "in_transit", "delivered", "cancelled"];
    const statusLabels = {
      pending: "Pendente", available: "Disponível", matched: "Compatível",
      in_transit: "Em Trânsito", delivered: "Entregue", cancelled: "Cancelado",
    };
    const statusColors = ["#f59e0b", "#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#ef4444"];

    const data = statusOrder.map(s => this._companyLoads.filter(l => l.status === s).length);

    if (data.every(v => v === 0)) {
      canvas.parentElement.innerHTML = `<div class="flex items-center justify-center h-full text-gray-400 text-sm">Nenhuma carga cadastrada</div>`;
      return;
    }

    this._chart = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: statusOrder.map(s => statusLabels[s]),
        datasets: [{
          data,
          backgroundColor: statusColors,
          borderWidth: 0,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "60%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: textColor,
              padding: 14,
              usePointStyle: true,
              pointStyle: "circle",
              font: { size: 11 },
            },
          },
        },
      },
    });
  },
};
