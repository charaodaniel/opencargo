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

  /** Card de filtro ativo (action) */
  _filterCard: "",

  /** Filtros */
  _filters: {
    action: "",
    entity_type: "",
    q: "",
    dateFrom: "",
    dateTo: "",
  },

  async render() {
    const user = Storage.getUser();
    if (!user || user.role !== "administrador") {
      return `<div class=\"text-center py-16 text-gray-500\">Acesso restrito a administradores.</div>`;
    }

    await Promise.all([this._fetchLogs(), this._fetchStats()]);

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
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
            <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            <span>Atividade Diária (30 dias)</span>
          </h3>
          <div class="relative" style="height: 200px;">
            <canvas id="chart-logs-activity"></canvas>
          </div>
        </div>

        <!-- Filter Cards (action) -->
        <div class="flex flex-wrap gap-2 mb-4">
          ${this._renderFilterCard("", "Todas", this._stats?.total || 0)}
          ${this._renderFilterCard("create", "Criações", this._stats?.by_action?.find(a => a.action === "create")?.count || 0)}
          ${this._renderFilterCard("update", "Atualizações", this._stats?.by_action?.find(a => a.action === "update")?.count || 0)}
          ${this._renderFilterCard("delete", "Exclusões", this._stats?.by_action?.find(a => a.action === "delete")?.count || 0)}
          ${this._renderFilterCard("login", "Logins", this._stats?.by_action?.find(a => a.action === "login")?.count || 0)}
        </div>

        <!-- Filters -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
                placeholder="Usuário, detalhes..."
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
   * Busca estatísticas dos logs
   */
  async _fetchStats() {
    try {
      const token = Storage.getToken();
      const res = await fetch(`${CONFIG.API_BASE_URL}/logs/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) this._stats = await res.json();
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

  clearFilters() {
    this._filters = { action: "", entity_type: "", q: "", dateFrom: "", dateTo: "" };
    this._filterCard = "";
    Router.refresh();
  },

  /**
   * Renderiza um card de filtro clicável
   */
  _renderFilterCard(value, label, count) {
    const isActive = this._filterCard === value;
    return `
      <button onclick="LogsPage.setFilterCard('${value}')"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
          ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600'
          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
        }">
        ${label}
        <span class="ml-1.5 text-xs ${isActive ? 'text-blue-200' : 'text-gray-400 dark:text-gray-500'}">(${count})</span>
      </button>
    `;
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

  afterRender() {
    this._initActivityChart();
  },

  /**
   * Inicializa o gráfico de atividade diária
   */
  _initActivityChart() {
    const canvas = document.getElementById("chart-logs-activity");
    if (!canvas || !this._stats?.daily_30) return;

    // Destrói chart anterior
    if (this._chart) {
      this._chart.destroy();
      this._chart = null;
    }

    const days = this._stats.daily_30;
    if (days.length === 0) {
      canvas.parentElement.innerHTML = `<div class="flex items-center justify-center h-full text-gray-400 text-sm">Nenhum dado disponível</div>`;
      return;
    }

    const isDark = document.documentElement.classList.contains("dark");
    const textColor = isDark ? "#9ca3af" : "#6b7280";
    const gridColor = isDark ? "#374151" : "#e5e7eb";

    // Preenche dias sem atividade com 0
    const labels = [];
    const data = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const found = days.find(day => day.day === key);
      labels.push(key.slice(5)); // MM-DD
      data.push(found ? found.count : 0);
    }

    this._chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Ações",
          data,
          backgroundColor: "rgba(59, 130, 246, 0.6)",
          borderColor: "#3b82f6",
          borderWidth: 1,
          borderRadius: 3,
          barPercentage: 0.8,
          categoryPercentage: 0.9,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => {
                const dateStr = items[0].label;
                const year = today.getFullYear();
                const month = dateStr.split("-")[0];
                const day = dateStr.split("-")[1];
                return `${day}/${month}/${year}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: textColor,
              stepSize: 1,
              precision: 0,
            },
            grid: { color: gridColor },
          },
          x: {
            ticks: {
              color: textColor,
              maxTicksLimit: 10,
              maxRotation: 0,
            },
            grid: { display: false },
          },
        },
      },
    });
  },
};
