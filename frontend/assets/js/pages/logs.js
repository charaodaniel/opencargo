/**
 * ── OpenCargo — Activity Logs Page ────────────────────
 * Histórico de ações dos usuários na plataforma.
 * Apenas administradores têm acesso.
 */

const LogsPage = {
  /** Dados */
  _logs: [],
  _stats: null,
  _page: 1,
  _totalPages: 1,

  /** Instância do gráfico */
  _chart: null,

  /** Período do gráfico de atividade */
  _chartPeriod: 30,

  /** Card de filtro ativo (action) */
  _filterCard: "",

  /** Lista de usuários para o filtro */
  _users: [],

  /** Filtros */
  _filters: {
    action: "",
    entity_type: "",
    user_id: "",
    q: "",
    dateFrom: "",
    dateTo: "",
  },

  async render() {
    const user = Storage.getUser();
    if (!user || user.role !== "administrador") {
      return `<div class=\"text-center py-16 text-gray-500\">Acesso restrito a administradores.</div>`;
    }

    await Promise.all([this._fetchLogs(), this._fetchStats(), this._fetchUsers()]);

    return `
      <div class="fade-in">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              <svg class="w-6 h-6 inline-block mr-2 -mt-0.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Histórico de Atividades
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Registro de todas as ações na plataforma</p>
          </div>
        </div>

        <!-- Stats -->
        ${this._stats ? this._renderStats() : ""}

        <!-- Daily Activity Chart -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              <span>Atividade Diária (${this._chartPeriod} dias)</span>
            </h3>
            <div class="flex items-center gap-1.5 sm:gap-2">
              <!-- Period Toggle -->
              <div class="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 mr-1 sm:mr-2">
                ${[7, 15, 30, 90].map(d => `
                  <button onclick="LogsPage.setChartPeriod(${d})"
                    class="px-2 py-1 text-xs font-medium rounded-md transition-all ${
                      this._chartPeriod === d
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }">${d}d</button>
                `).join("")}
              </div>
              <!-- Export Buttons -->
              <button onclick="LogsPage.exportChartPNG()"
                class="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Exportar como PNG">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                <span>PNG</span>
              </button>
              <button onclick="LogsPage.exportChartSVG()"
                class="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Exportar como SVG">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                <span>SVG</span>
              </button>
            </div>
          </div>
          <div class="relative" style="height: 200px;">
            <canvas id="chart-logs-activity"></canvas>
          </div>
        </div>

        <!-- Filter Cards (action) -->
        <div class="flex flex-wrap gap-2 mb-4">
          ${Utils.renderFilterCard({ value: "", label: "Todas", count: this._stats?.total || 0, isActive: this._filterCard === "", pageNs: "LogsPage" })}
          ${Utils.renderFilterCard({ value: "create", label: "Criações", count: this._stats?.by_action?.find(a => a.action === "create")?.count || 0, isActive: this._filterCard === "create", pageNs: "LogsPage" })}
          ${Utils.renderFilterCard({ value: "update", label: "Atualizações", count: this._stats?.by_action?.find(a => a.action === "update")?.count || 0, isActive: this._filterCard === "update", pageNs: "LogsPage" })}
          ${Utils.renderFilterCard({ value: "delete", label: "Exclusões", count: this._stats?.by_action?.find(a => a.action === "delete")?.count || 0, isActive: this._filterCard === "delete", pageNs: "LogsPage" })}
          ${Utils.renderFilterCard({ value: "login", label: "Logins", count: this._stats?.by_action?.find(a => a.action === "login")?.count || 0, isActive: this._filterCard === "login", pageNs: "LogsPage" })}
        </div>

        <!-- Period quick filters -->
        ${Utils.renderPeriodFilter({ dateFrom: this._filters.dateFrom, dateTo: this._filters.dateTo, pageNs: "LogsPage" })}

        <!-- Filters -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Usuário</label>
              <select onchange="LogsPage.setFilter('user_id', this.value)"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Todos</option>
                ${this._users.map(u => `
                  <option value="${u.user_id}" ${this._filters.user_id === u.user_id ? "selected" : ""}>${Utils.escapeHtml(u.user_name)}</option>
                `).join("")}
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Ação</label>
              <select onchange="LogsPage.setFilter('action', this.value)"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Todas</option>
                <option value="create" ${this._filters.action === "create" ? "selected" : ""}>Criação</option>
                <option value="update" ${this._filters.action === "update" ? "selected" : ""}>Atualização</option>
                <option value="delete" ${this._filters.action === "delete" ? "selected" : ""}>Exclusão</option>
                <option value="login" ${this._filters.action === "login" ? "selected" : ""}>Login</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Entidade</label>
              <select onchange="LogsPage.setFilter('entity_type', this.value)"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Todas</option>
                <option value="users" ${this._filters.entity_type === "users" ? "selected" : ""}>Usuários</option>
                <option value="companies" ${this._filters.entity_type === "companies" ? "selected" : ""}>Empresas</option>
                <option value="drivers" ${this._filters.entity_type === "drivers" ? "selected" : ""}>Motoristas</option>
                <option value="vehicles" ${this._filters.entity_type === "vehicles" ? "selected" : ""}>Veículos</option>
                <option value="routes" ${this._filters.entity_type === "routes" ? "selected" : ""}>Rotas</option>
                <option value="loads" ${this._filters.entity_type === "loads" ? "selected" : ""}>Cargas</option>
                <option value="matching" ${this._filters.entity_type === "matching" ? "selected" : ""}>Matching</option>
                <option value="auth" ${this._filters.entity_type === "auth" ? "selected" : ""}>Auth</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Busca</label>
              <input type="text" value="${Utils.escapeHtml(this._filters.q)}"
                oninput="LogsPage.setFilter('q', this.value)"
                placeholder="Detalhes..."
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Data início</label>
              <input type="date" value="${this._filters.dateFrom}"
                onchange="LogsPage.setFilter('dateFrom', this.value)"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Data fim</label>
              <div class="flex space-x-2">
                <input type="date" value="${this._filters.dateTo}"
                  onchange="LogsPage.setFilter('dateTo', this.value)"
                  class="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <button onclick="LogsPage.clearFilters()"
                  class="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  ${__("action.clearFilters")}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Log list -->
        ${this._logs.length === 0
          ? this._renderEmpty()
          : this._renderLogList()}

        <!-- Pagination -->
        ${this._totalPages > 1 ? this._renderPagination() : ""}
      </div>
    `;
  },

  /**
   * Renderiza cards de estatísticas
   */
  _renderStats() {
    const s = this._stats;
    return `
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p class="text-xs text-gray-500 uppercase tracking-wider font-medium">Total de ações</p>
          <p class="text-2xl font-bold text-gray-900 dark:white mt-1">${Utils.formatNumber(s.total)}</p>
        </div>
        ${(s.by_action || []).slice(0, 3).map(a => `
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <p class="text-xs text-gray-500 uppercase tracking-wider font-medium">
              ${a.action === "create" ? "Criações" : a.action === "update" ? "Atualizações" : a.action === "delete" ? "Exclusões" : a.action}
            </p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">${Utils.formatNumber(a.count)}</p>
          </div>
        `).join("")}
      </div>
    `;
  },

  /**
   * Renderiza lista de logs
   */
  _renderLogList() {
    const actionLabels = {
      create: { label: "Criou", color: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400" },
      update: { label: "Atualizou", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400" },
      delete: { label: "Excluiu", color: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400" },
      login: { label: "Login", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400" },
    };
    const a = actionLabels;

    return `
      <div class="space-y-2">
        ${this._logs.map(log => {
          const act = a[log.action] || { label: log.action, color: "bg-gray-100 text-gray-800" };
          const details = log.details ? (log.details.body ? Object.keys(log.details.body).join(", ") : JSON.stringify(log.details).slice(0, 100)) : "";
          return `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-200 dark:hover:border-blue-700 transition-colors">
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2 flex-wrap">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${act.color}">${act.label}</span>
                    <span class="text-sm font-medium text-gray-900 dark:text-white">${Utils.escapeHtml(log.user_name)}</span>
                    <span class="text-xs text-gray-400">em</span>
                    <span class="text-xs font-medium text-gray-600 dark:text-gray-300">${log.entity_type}${log.entity_id ? ` #${log.entity_id.slice(0, 8)}` : ""}</span>
                  </div>
                  ${details ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">${Utils.escapeHtml(details)}</p>` : ""}
                </div>
                <div class="text-right shrink-0 ml-3">
                  <p class="text-xs text-gray-400">${Utils.formatDate(log.created_at, true)}</p>
                  ${log.ip ? `<p class="text-xs text-gray-400 font-mono">${log.ip}</p>` : ""}
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  },

  /**
   * Estado vazio
   */
  _renderEmpty() {
    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Nenhum log encontrado</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">As ações dos usuários aparecerão aqui automaticamente.</p>
      </div>
    `;
  },

  /**
   * Renderiza paginação
   */
  _renderPagination() {
    return `
      <div class="flex items-center justify-between mt-4">
        <button onclick="LogsPage.goToPage(${this._page - 1})"
          ${this._page <= 1 ? 'disabled' : ''}
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          ${__("action.back")}
        </button>
        <span class="text-sm text-gray-600 dark:text-gray-400">Página ${this._page} de ${this._totalPages}</span>
        <button onclick="LogsPage.goToPage(${this._page + 1})"
          ${this._page >= this._totalPages ? 'disabled' : ''}
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          ${__("action.next")}
        </button>
      </div>
    `;
  },

  // ═══ Data fetching ═════════════════════════════════

  /**
   * Busca logs da API
   */
  async _fetchLogs(page = 1) {
    try {
      const token = Storage.getToken();
      const params = new URLSearchParams({ page, limit: 30 });
      Object.entries(this._filters).forEach(([k, v]) => { if (v) params.set(k, v); });

      const res = await fetch(`${CONFIG.API_BASE_URL}/logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Erro: ${res.status}`);

      const json = await res.json();
      this._logs = json.data || [];
      this._page = json.page || 1;
      this._totalPages = json.totalPages || 1;
    } catch {
      this._logs = [];
      this._totalPages = 1;
    }
  },

  /**
   * Busca estatísticas dos logs para o período atual
   */
  async _fetchStats() {
    try {
      const token = Storage.getToken();
      const res = await fetch(`${CONFIG.API_BASE_URL}/logs/stats?days=${this._chartPeriod}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) this._stats = await res.json();
    } catch { /* fallback */ }
  },

  /**
   * Busca lista de usuários para o filtro
   */
  async _fetchUsers() {
    try {
      const token = Storage.getToken();
      const res = await fetch(`${CONFIG.API_BASE_URL}/logs/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) this._users = await res.json();
    } catch { /* fallback */ }
  },

  // ═══ Actions ═══════════════════════════════════════

  setFilter(key, value) {
    this._filters[key] = value;
    if (key === "action") {
      this._filterCard = value;
    }
    Router.refresh();
  },

  /**
   * Define filtro por período predefinido
   */
  setPeriod(period) {
    const { dateFrom, dateTo } = Utils.getPeriodDates(period);
    this._filters.dateFrom = dateFrom;
    this._filters.dateTo = dateTo;
    Router.refresh();
  },

  clearFilters() {
    this._filters = { action: "", entity_type: "", user_id: "", q: "", dateFrom: "", dateTo: "" };
    this._filterCard = "";
    Router.refresh();
  },

  /**
   * Define o filtro card (sincroniza com _filters.action)
   */
  setFilterCard(value) {
    this._filterCard = value;
    this._filters.action = value;
    Router.refresh();
  },

  async goToPage(page) {
    if (page < 1 || page > this._totalPages) return;
    await this._fetchLogs(page);
    Router.refresh();
  },

  /**
   * Altera o período do gráfico e recarrega os dados
   */
  async setChartPeriod(period) {
    this._chartPeriod = period;
    await this._fetchStats();
    Router.refresh();
  },

  afterRender() {
    this._initActivityChart();
  },

  /**
   * Exporta o gráfico como PNG e faz download
   */
  exportChartPNG() {
    const canvas = document.getElementById("chart-logs-activity");
    if (!canvas) return;

    const period = this._chartPeriod;
    const link = document.createElement("a");
    link.download = `atividade-${period}d-${new Date().toISOString().split("T")[0]}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    Toast.success("Gráfico exportado como PNG!");
  },

  /**
   * Exporta o gráfico como SVG (envolve a imagem PNG em um container SVG)
   */
  exportChartSVG() {
    const canvas = document.getElementById("chart-logs-activity");
    if (!canvas) return;

    const imgData = canvas.toDataURL("image/png");
    const width = canvas.offsetWidth || canvas.width;
    const height = canvas.offsetHeight || canvas.height;

    // Gera um SVG que encapsula a imagem PNG
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image width="${width}" height="${height}" xlink:href="${imgData}"/>
</svg>`;

    const period = this._chartPeriod;
    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `atividade-${period}d-${new Date().toISOString().split("T")[0]}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    Toast.success("Gráfico exportado como SVG!");
  },

  /**
   * Inicializa o gráfico de atividade diária com barras empilhadas
   * (create/update/delete/login com cores distintas)
   * Usa o período selecionado (_chartPeriod: 7/15/30/90)
   */
  _initActivityChart() {
    const canvas = document.getElementById("chart-logs-activity");
    if (!canvas || !this._stats?.daily) return;

    // Destrói chart anterior
    if (this._chart) {
      this._chart.destroy();
      this._chart = null;
    }

    const rows = this._stats.daily;
    const period = this._chartPeriod;
    if (rows.length === 0) {
      canvas.parentElement.innerHTML = `<div class="flex items-center justify-center h-full text-gray-400 text-sm">Nenhum dado disponível para ${period} dias</div>`;
      return;
    }

    const isDark = document.documentElement.classList.contains("dark");
    const textColor = isDark ? "#9ca3af" : "#6b7280";
    const gridColor = isDark ? "#374151" : "#e5e7eb";
    const today = new Date();

    // Actions que queremos mostrar (com cores e labels)
    const ACTIONS = {
      create: { label: "Criações", color: "rgba(34, 197, 94, 0.75)", border: "#22c55e" },
      update: { label: "Atualizações", color: "rgba(59, 130, 246, 0.75)", border: "#3b82f6" },
      delete: { label: "Exclusões", color: "rgba(239, 68, 68, 0.75)", border: "#ef4444" },
      login: { label: "Logins", color: "rgba(168, 85, 247, 0.75)", border: "#a855f7" },
      login_failed: { label: "Login Falhas", color: "rgba(249, 115, 22, 0.75)", border: "#f97316" },
    };
    const actionKeys = Object.keys(ACTIONS);

    // Gera labels para os últimos N dias (conforme período selecionado)
    const labels = [];
    const dateKeys = [];
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      labels.push(key.slice(5)); // MM-DD
      dateKeys.push(key);
    }

    // Constrói um mapa: day -> { action: count }
    const dayMap = {};
    rows.forEach(r => {
      if (!dayMap[r.day]) dayMap[r.day] = {};
      dayMap[r.day][r.action] = (dayMap[r.day][r.action] || 0) + r.count;
    });

    // Monta datasets: um para cada action
    const datasets = actionKeys.map(action => ({
      label: ACTIONS[action].label,
      data: dateKeys.map(key => dayMap[key]?.[action] || 0),
      backgroundColor: ACTIONS[action].color,
      borderColor: ACTIONS[action].border,
      borderWidth: 1,
      borderRadius: 2,
    }));

    // Ajusta maxTicksLimit conforme o período para não poluir
    const maxTicks = period <= 15 ? period : period <= 30 ? 15 : 20;

    this._chart = new Chart(canvas, {
      type: "bar",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: "bottom",
            labels: {
              color: textColor,
              boxWidth: 12,
              boxHeight: 12,
              borderRadius: 3,
              padding: 12,
              font: { size: 11 },
              usePointStyle: true,
              pointStyle: "rectRounded",
            },
          },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              title: (items) => {
                const dateStr = items[0].label;
                const year = today.getFullYear();
                const month = dateStr.split("-")[0];
                const day = dateStr.split("-")[1];
                return `${day}/${month}/${year}`;
              },
              footer: (items) => {
                const total = items.reduce((sum, i) => sum + (i.parsed?.y || 0), 0);
                return `Total: ${total}`;
              },
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            ticks: {
              color: textColor,
              maxTicksLimit: maxTicks,
              maxRotation: period > 30 ? 45 : 0,
            },
            grid: { display: false },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: {
              color: textColor,
              stepSize: 1,
              precision: 0,
            },
            grid: { color: gridColor },
          },
        },
      },
    });
  },
};
