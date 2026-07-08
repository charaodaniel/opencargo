/**
 * ── OpenCargo — Freight History Page ──────────────────
 * Histórico completo de fretes realizados.
 * Exibe timeline de matches, cargas, motoristas e empresas
 * com filtros, busca e estatísticas agregadas.
 */

const FreightsPage = {
  /** Filtros ativos */
  _filters: {
    status: "",
    q: "",
    dateFrom: "",
    dateTo: "",
    role: "",
  },

  /** Dados carregados */
  _freights: [],
  _stats: null,
  _users: [],

  async render() {
    await Promise.all([
      this._fetchFreights(),
      this._fetchStats(),
    ]);

    return this._buildHTML();
  },

  /**
   * Busca histórico de fretes
   */
  async _fetchFreights() {
    try {
      const params = new URLSearchParams();
      Object.entries(this._filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      this._freights = await Api.get(`freights/history?${params.toString()}`);
    } catch {
      this._freights = [];
    }
  },

  /**
   * Busca estatísticas
   */
  async _fetchStats() {
    try {
      this._stats = await Api.get("freights/stats");
    } catch {
      this._stats = null;
    }
  },

  /**
   * Constrói HTML completo
   */
  _buildHTML() {
    return `
      <div class="fade-in">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">${__("page.freights")}</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">${__("page.freights.desc")}</p>
          </div>
        </div>

        <!-- Stats Cards -->
        ${this._stats ? this._renderStats() : ""}

        <!-- Filters -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <!-- Search -->
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">${__("action.search")}</label>
              <div class="relative">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input type="text" value="${Utils.escapeHtml(this._filters.q)}"
                  oninput="FreightsPage.setFilter('q', this.value)"
                  placeholder="Carga, motorista, empresa..."
                  class="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>

            <!-- Status filter -->
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">${__("label.status")}</label>
              <select onchange="FreightsPage.setFilter('status', this.value)"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">${__("label.all")}</option>
                <option value="completed" ${this._filters.status === "completed" ? "selected" : ""}>${__("status.completed")}</option>
                <option value="accepted" ${this._filters.status === "accepted" ? "selected" : ""}>${__("status.accepted")}</option>
                <option value="pending" ${this._filters.status === "pending" ? "selected" : ""}>${__("status.pending")}</option>
                <option value="cancelled" ${this._filters.status === "cancelled" ? "selected" : ""}>${__("status.cancelled")}</option>
              </select>
            </div>

            <!-- Date from -->
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">${__("match.dateFrom")}</label>
              <input type="date" value="${this._filters.dateFrom}"
                onchange="FreightsPage.setFilter('dateFrom', this.value)"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>

            <!-- Date to -->
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">${__("match.dateTo")}</label>
              <input type="date" value="${this._filters.dateTo}"
                onchange="FreightsPage.setFilter('dateTo', this.value)"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>

            <!-- Clear -->
            <div class="flex items-end">
              <button onclick="FreightsPage.clearFilters()"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                ${__("action.clearFilters")}
              </button>
            </div>
          </div>
        </div>

        <!-- Filter chips -->
        ${this._renderFilterChips()}

        <!-- Results -->
        ${this._freights.length === 0
          ? this._renderEmptyState()
          : this._renderFreightList()}
      </div>
    `;
  },

  /**
   * Renderiza cards de estatísticas
   */
  _renderStats() {
    const s = this._stats;
    const items = [
      { label: __("freight.total"), value: s.total, color: "blue" },
      { label: __("freight.completed"), value: s.completed, color: "green" },
      { label: __("freight.inProgress"), value: s.in_progress, color: "amber" },
      { label: __("freight.cancelled"), value: s.cancelled, color: "red" },
    ];

    return `
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        ${items.map((item) => `
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">${item.label}</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">${item.value}</p>
          </div>
        `).join("")}
      </div>
    `;
  },

  /**
   * Renderiza chips de filtros ativos
   */
  _renderFilterChips() {
    const chips = [];
    if (this._filters.q) chips.push({ key: "q", label: `"${this._filters.q}"` });
    if (this._filters.status) chips.push({ key: "status", label: __(`status.${this._filters.status}`) });
    if (this._filters.dateFrom) chips.push({ key: "dateFrom", label: `${__("match.dateFrom")}: ${Utils.formatDate(this._filters.dateFrom)}` });
    if (this._filters.dateTo) chips.push({ key: "dateTo", label: `${__("match.dateTo")}: ${Utils.formatDate(this._filters.dateTo)}` });

    if (chips.length === 0) return "";

    return `
      <div class="flex flex-wrap gap-2 mb-4">
        ${chips.map((chip) => `
          <span class="inline-flex items-center space-x-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full">
            <span>${chip.label}</span>
            <button onclick="FreightsPage.removeFilter('${chip.key}')" class="hover:text-blue-900 dark:hover:text-blue-100 ml-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </span>
        `).join("")}
      </div>
    `;
  },

  /**
   * Renderiza lista de fretes
   */
  _renderFreightList() {
    return `
      <div class="space-y-4">
        ${this._freights.map((f) => this._renderFreightCard(f)).join("")}
      </div>
    `;
  },

  /**
   * Renderiza card de um frete
   */
  _renderFreightCard(f) {
    const { match, load, driver, company, route, vehicle } = f;
    const statusColor = Utils.getStatusClass(match.status);
    const driverStars = driver.avg_rating
      ? `<span class="text-yellow-500 text-xs">${"★".repeat(Math.round(driver.avg_rating))}${"☆".repeat(5 - Math.round(driver.avg_rating))}</span>`
      : "";

    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200">
        <!-- Top bar: status + score -->
        <div class="flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
          <div class="flex items-center space-x-3">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${Utils.getStatusClass(match.status)}">
              ${Utils.getStatusLabel(match.status)}
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-400">
              ${Utils.formatDate(match.created_at, true)}
            </span>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-xs text-gray-400">Score:</span>
            <span class="text-sm font-bold ${match.score >= 75 ? "text-green-600" : match.score >= 50 ? "text-yellow-600" : "text-gray-500"}">${match.score}%</span>
          </div>
        </div>

        <!-- Body -->
        <div class="p-5">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <!-- Carga -->
            <div>
              <p class="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-1">${__("freight.load")}</p>
              <p class="font-semibold text-gray-900 dark:text-white text-sm truncate">${Utils.escapeHtml(load.title)}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                ${Utils.escapeHtml(load.origin_city)}/${load.origin_state}
                <span class="mx-1">→</span>
                ${Utils.escapeHtml(load.destination_city)}/${load.destination_state}
              </p>
              <div class="flex flex-wrap gap-1.5 mt-1.5">
                <span class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">${Utils.formatNumber(load.weight_kg)} kg</span>
                ${load.type ? `<span class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">${load.type}</span>` : ""}
              </div>
            </div>

            <!-- Motorista -->
            <div>
              <p class="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-1">${__("freight.driver")}</p>
              <p class="font-medium text-gray-900 dark:text-white text-sm">${Utils.escapeHtml(driver.name)}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">${driver.city ? `${driver.city}/${driver.state}` : ""}</p>
              ${driverStars ? `<div class="flex items-center space-x-1 mt-0.5">${driverStars} <span class="text-xs text-gray-400">(${driver.total_reviews})</span></div>` : ""}
              ${vehicle?.plate ? `<p class="text-xs text-gray-400 mt-0.5">${vehicle.model || ""} · ${vehicle.plate}</p>` : ""}
            </div>

            <!-- Empresa -->
            <div>
              <p class="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-1">${__("freight.company")}</p>
              <p class="font-medium text-gray-900 dark:text-white text-sm">${Utils.escapeHtml(company.name)}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">${company.city ? `${company.city}/${company.state}` : ""}</p>
              ${company.avg_rating ? `
                <div class="flex items-center space-x-1 mt-0.5">
                  <span class="text-yellow-500 text-xs">${"★".repeat(Math.round(company.avg_rating))}${"☆".repeat(5 - Math.round(company.avg_rating))}</span>
                  <span class="text-xs text-gray-400">(${company.total_reviews})</span>
                </div>
              ` : ""}
            </div>
          </div>

          <!-- Dates -->
          <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span class="inline-flex items-center space-x-1">${Icons.calendar({ class: 'w-3.5 h-3.5' })} <span>${__("freight.pickup")}: ${Utils.formatDate(load.pickup_date)}</span></span>
            <span class="inline-flex items-center space-x-1">${Icons.pin({ class: 'w-3.5 h-3.5' })} <span>${__("freight.delivery")}: ${Utils.formatDate(load.delivery_date)}</span></span>
            ${route?.departure_date ? `<span class="inline-flex items-center space-x-1">${Icons.truck({ class: 'w-3.5 h-3.5' })} <span>${__("freight.departure")}: ${Utils.formatDate(route.departure_date)}</span></span>` : ""}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Estado vazio
   */
  _renderEmptyState() {
    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <div class="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">${__("freight.empty.title")}</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">${__("freight.empty.desc")}</p>
      </div>
    `;
  },

  // ═══ Actions ═════════════════════════════════════

  setFilter(key, value) {
    this._filters[key] = value;
    Router.refresh();
  },

  removeFilter(key) {
    this._filters[key] = "";
    Router.refresh();
  },

  clearFilters() {
    this._filters = { status: "", q: "", dateFrom: "", dateTo: "", role: "" };
    Router.refresh();
  },
};
