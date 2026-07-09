/**
 * ── OpenCargo — Matching Page ─────────────────────────
 * Motor de matching entre cargas e rotas.
 * Com filtros avançados, score de compatibilidade e busca.
 */

const MatchingPage = {
  _filters: {
    type: "loads",
    q: "",
    originState: "",
    destinationState: "",
    weightMin: "",
    weightMax: "",
    dateFrom: "",
    dateTo: "",
    loadType: "",
    sortBy: "score",
    sortOrder: "desc",
    minScore: 0,
  },

  _filterOptions: {
    states: [],
    loadTypes: [],
  },

  _results: [],
  _matches: [],

  async render() {
    const filterOpts = await this._fetchFilterOptions();

    // Tenta carregar matches do backend, mas não quebra a página se falhar
    // O backend expõe GET /api/matching (não /api/matches)
    try {
      const matchData = await Api.get("matching");
      this._matches = Array.isArray(matchData) ? matchData : (matchData?.data || []);
    } catch {
      this._matches = [];
    }

    this._filterOptions = filterOpts;

    // Busca inicial
    await this._search();

    return this._buildHTML();
  },

  /**
   * Busca opções de filtro disponíveis
   */
  async _fetchFilterOptions() {
    try {
      return await Api.get("matching/filters");
    } catch {
      return { states: [], loadTypes: ["Carga Geral", "Carga Frágil", "Carga Frigorífica", "Carga Perigosa", "Granel"] };
    }
  },

  /**
   * Executa a busca com filtros atuais
   */
  async _search() {
    try {
      const params = new URLSearchParams();

      // Monta params apenas com valores preenchidos
      Object.entries(this._filters).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          params.set(key, value);
        }
      });

      this._results = await Api.get(`matching/search?${params.toString()}`);
    } catch (error) {
      console.error("Erro na busca de matching:", error);
      this._results = { results: [], total: 0 };
    }
  },

  /**
   * Constrói o HTML completo da página
   */
  _buildHTML() {
    const results = this._results.results || [];
    const total = this._results.total || 0;

    return `
      <div class="fade-in">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">${__("page.matching")}</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">${__("page.matching.desc")}</p>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-500 dark:text-gray-400">
              ${total} ${total === 1 ? __("match.result") : __("match.results")}
            </span>
          </div>
        </div>

        <!-- ═══ Filtros ═══ -->
        <div class="glass-card rounded-xl p-4 sm:p-6 mb-6">
          <!-- Toggle tipo de busca -->
          <div class="flex items-center space-x-2 mb-5">
            <button onclick="MatchingPage.setFilter('type', 'loads')"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                this._filters.type === "loads"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              }">
              ${Icons.package({ class: 'w-4 h-4 shrink-0' })} ${__("match.loadsForDrivers")}
            </button>
            <button onclick="MatchingPage.setFilter('type', 'drivers')"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                this._filters.type === "drivers"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              }">
              ${Icons.truck({ class: 'w-4 h-4 shrink-0' })} ${__("match.driversForLoads")}
            </button>
          </div>

          <!-- Busca por proximidade (Cargas perto de mim) -->
          <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium text-blue-700 dark:text-blue-300">📍 Cargas perto de mim</span>
              <button onclick="MatchingPage.searchNearby()"
                class="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors active:scale-95">
                Buscar perto
              </button>
            </div>
            <div class="flex gap-2">
              <input type="text" id="nearby-city" placeholder="Cidade (opcional)"
                class="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
              <input type="text" id="nearby-state" placeholder="UF" maxlength="2"
                class="w-14 px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 uppercase" />
              <input type="number" id="nearby-radius" placeholder="Km" value="150"
                class="w-20 px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
            </div>
            <div id="nearby-status" class="mt-1 text-xs text-blue-600 dark:text-blue-400 hidden"></div>
          </div>

          <!-- Grid de filtros -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <!-- Search -->
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">${__("match.search")}</label>
              <div class="relative">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input type="text" value="${Utils.escapeHtml(this._filters.q)}"
                  oninput="MatchingPage.setFilter('q', this.value)"
                  placeholder="${__("match.search.placeholder")}"
                  class="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>

            <!-- Estado Origem -->
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">${__("match.ufOrigin")}</label>
              <select onchange="MatchingPage.setFilter('originState', this.value)"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Todas</option>
                ${this._filterOptions.states.map((s) => `
                  <option value="${s}" ${this._filters.originState === s ? "selected" : ""}>${s}</option>
                `).join("")}
              </select>
            </div>

            <!-- Estado Destino -->
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">${__("match.ufDest")}</label>
              <select onchange="MatchingPage.setFilter('destinationState', this.value)"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Todas</option>
                ${this._filterOptions.states.map((s) => `
                  <option value="${s}" ${this._filters.destinationState === s ? "selected" : ""}>${s}</option>
                `).join("")}
              </select>
            </div>

            <!-- Tipo de Carga -->
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">${__("match.loadType")}</label>
              <select onchange="MatchingPage.setFilter('loadType', this.value)"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">${__("label.all")}</option>
                ${this._filterOptions.loadTypes.map((t) => `
                  <option value="${t}" ${this._filters.loadType === t ? "selected" : ""}>${t}</option>
                `).join("")}
              </select>
            </div>

            <!-- Peso Mín -->
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">${__("match.weightMin")}</label>
              <input type="number" value="${this._filters.weightMin}"
                oninput="MatchingPage.setFilter('weightMin', this.value)"
                placeholder="0"
                min="0"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>

            <!-- Peso Máx -->
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">${__("match.weightMax")}</label>
              <input type="number" value="${this._filters.weightMax}"
                oninput="MatchingPage.setFilter('weightMax', this.value)"
                placeholder="99999"
                min="0"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>

            <!-- Data Início -->
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">${__("match.dateFrom")}</label>
              <input type="date" value="${this._filters.dateFrom}"
                onchange="MatchingPage.setFilter('dateFrom', this.value)"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>

            <!-- Data Fim -->
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">${__("match.dateTo")}</label>
              <input type="date" value="${this._filters.dateTo}"
                onchange="MatchingPage.setFilter('dateTo', this.value)"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>

            <!-- Period quick filters -->
            <div class="lg:col-span-4">
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Período</label>
              ${Utils.renderPeriodFilter({ dateFrom: this._filters.dateFrom, dateTo: this._filters.dateTo, pageNs: "MatchingPage" })}
            </div>

            <!-- Score Mín -->
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">${__("match.minScore")}</label>
              <select onchange="MatchingPage.setFilter('minScore', this.value)"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="0" ${this._filters.minScore == 0 ? "selected" : ""}>${__("match.any")}</option>
                <option value="25" ${this._filters.minScore == 25 ? "selected" : ""}>≥ 25</option>
                <option value="50" ${this._filters.minScore == 50 ? "selected" : ""}>≥ 50</option>
                <option value="75" ${this._filters.minScore == 75 ? "selected" : ""}>≥ 75</option>
                <option value="90" ${this._filters.minScore == 90 ? "selected" : ""}>≥ 90</option>
              </select>
            </div>

            <!-- Ordenar por -->
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">${__("match.sortBy")}</label>
              <select onchange="MatchingPage.setFilter('sortBy', this.value)"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="score" ${this._filters.sortBy === "score" ? "selected" : ""}>${__("match.sort.score")}</option>
                <option value="date" ${this._filters.sortBy === "date" ? "selected" : ""}>${__("match.sort.date")}</option>
                <option value="weight" ${this._filters.sortBy === "weight" ? "selected" : ""}>${__("match.sort.weight")}</option>
              </select>
            </div>

            <!-- Ordenar ordem -->
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">${__("match.sortOrder")}</label>
              <select onchange="MatchingPage.setFilter('sortOrder', this.value)"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="desc" ${this._filters.sortOrder === "desc" ? "selected" : ""}>${__("match.order.desc")}</option>
                <option value="asc" ${this._filters.sortOrder === "asc" ? "selected" : ""}>${__("match.order.asc")}</option>
              </select>
            </div>
          </div>

          <!-- Ações: limpar filtros -->
          <div class="flex justify-end">
            <button onclick="MatchingPage.clearFilters()"
              class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center space-x-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              <span>${__("action.clearFilters")}</span>
            </button>
          </div>
        </div>

        <!-- ═══ Filter Chips ═══ -->
        ${this._renderFilterChips()}

        <!-- ═══ Resultados ═══ -->
        ${results.length === 0 ? this._renderEmptyState() : this._renderResults(results)}
      </div>
    `;
  },

  /**
   * Renderiza chips de filtros ativos
   */
  _renderFilterChips() {
    const chips = [];

    if (this._filters.q) chips.push({ key: "q", label: `"${this._filters.q}"` });
    if (this._filters.originState) chips.push({ key: "originState", label: `UF Orig: ${this._filters.originState}` });
    if (this._filters.destinationState) chips.push({ key: "destinationState", label: `UF Dest: ${this._filters.destinationState}` });
    if (this._filters.loadType) chips.push({ key: "loadType", label: this._filters.loadType });
    if (this._filters.weightMin) chips.push({ key: "weightMin", label: `≥ ${Utils.formatNumber(this._filters.weightMin)}kg` });
    if (this._filters.weightMax) chips.push({ key: "weightMax", label: `≤ ${Utils.formatNumber(this._filters.weightMax)}kg` });
    if (this._filters.dateFrom) chips.push({ key: "dateFrom", label: `De: ${Utils.formatDate(this._filters.dateFrom)}` });
    if (this._filters.dateTo) chips.push({ key: "dateTo", label: `Até: ${Utils.formatDate(this._filters.dateTo)}` });
    if (this._filters.minScore > 0) chips.push({ key: "minScore", label: `Score ≥ ${this._filters.minScore}%` });

    if (chips.length === 0) return "";

    return `
      <div class="flex flex-wrap gap-2 mb-4">
        ${chips.map((chip) => `
          <span class="inline-flex items-center space-x-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full">
            <span>${chip.label}</span>
            <button onclick="MatchingPage.removeFilter('${chip.key}')" class="hover:text-blue-900 dark:hover:text-blue-100 ml-1">
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
   * Renderiza resultados da busca
   */
  _renderResults(results) {
    const isLoads = this._filters.type === "loads";

    return `
      <div class="space-y-4">
        ${results.map((item) => {
          if (isLoads) {
            return this._renderLoadResult(item);
          } else {
            return this._renderDriverResult(item);
          }
        }).join("")}
      </div>
    `;
  },

  /**
   * Renderiza um resultado de carga para motorista
   */
  _renderLoadResult(item) {
    const { load, route, score, match_reasons } = item;

    return `
      <div class="glass-card rounded-xl p-4 sm:p-5 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <!-- Info principal -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start space-x-3">
              <!-- Score circular -->
              <div class="shrink-0">
                ${this._renderScoreCircle(score)}
              </div>
              <div class="min-w-0">
                <h3 class="font-semibold text-gray-900 dark:text-white truncate">${Utils.escapeHtml(load.title)}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  <span class="font-medium">${Utils.escapeHtml(load.origin_city)}/${load.origin_state}</span>
                  <span class="mx-1.5 text-gray-300 dark:text-gray-600">→</span>
                  <span class="font-medium">${Utils.escapeHtml(load.destination_city)}/${load.destination_state}</span>
                </p>
              </div>
            </div>
          </div>

          <!-- Detalhes carga -->
          <div class="flex flex-wrap gap-2 sm:gap-3 sm:shrink-0">
            <span class="inline-flex items-center space-x-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/></svg>
              <span>${Utils.formatNumber(load.weight_kg)} kg</span>
            </span>
            ${load.volume_m3 ? `
              <span class="inline-flex items-center space-x-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full">
                ${Icons.cube({ class: 'w-3.5 h-3.5' })} ${Utils.formatNumber(load.volume_m3)} m³
              </span>
            ` : ""}              <span class="inline-flex items-center space-x-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full">
                ${Icons.calendar({ class: 'w-3.5 h-3.5' })} ${Utils.formatDate(load.pickup_date)}
              </span>
            ${load.type ? `
              <span class="inline-flex items-center space-x-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full">
                ${load.type}
              </span>
            ` : ""}
          </div>
        </div>

        <!-- Rota compatível -->
        ${route ? `
          <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <span class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">${__("match.compatibleRoute")}</span>
              <span class="text-gray-300 dark:text-gray-600">•</span>
              <span>${Utils.escapeHtml(route.driver_name || "Motorista")}</span>
              <span class="text-gray-300 dark:text-gray-600">•</span>
              <span>${Utils.escapeHtml(route.origin_city)}/${route.origin_state} → ${Utils.escapeHtml(route.destination_city)}/${route.destination_state}</span>
              <span class="text-gray-300 dark:text-gray-600">•</span>
              <span>${route.vehicle_model || route.vehicle_type || __("label.vehicle")}</span>
            </div>
          </div>
        ` : ""}

        <!-- Match reasons -->
        ${match_reasons && match_reasons.length > 0 ? `
          <div class="mt-2 flex flex-wrap gap-1.5">
            ${match_reasons.map((r) => `
              <span class="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">✓ ${r}</span>
            `).join("")}
          </div>
        ` : ""}

        <!-- Ações: Chat / Anexar doc / Criar OS -->
        <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex gap-2">
          <button onclick="MatchingPage.openChat('${load.id}', '${route?.driver_id || ""}', '${Utils.escapeHtml(load.title)}')"
            class="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium flex items-center space-x-1">
            ${Icons.chat({ class: 'w-3.5 h-3.5', noHover: true })}
            <span>Chat</span>
          </button>
          <button onclick="MatchingPage.attachDocument('${load.id}', '${Utils.escapeHtml(load.title)}')"
            class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center space-x-1">
            ${Icons.paperclip({ class: 'w-3.5 h-3.5', noHover: true })}
            <span>Anexar doc</span>
          </button>
          <button onclick="MatchingPage.createServiceOrder('${load.id}', '${route?.id || ""}', '${Utils.escapeHtml(load.title)}')"
            class="text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium flex items-center space-x-1">
            ${Icons.document({ class: 'w-3.5 h-3.5', noHover: true })}
            <span>Criar OS</span>
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Renderiza um resultado de motorista para carga
   */
  _renderDriverResult(item) {
    const { load, driver, vehicle, route, score, match_reasons } = item;

    return `
      <div class="glass-card rounded-xl p-4 sm:p-5 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-start space-x-3">
              ${this._renderScoreCircle(score)}
              <div class="min-w-0">
                <div class="flex items-center space-x-2">
                  <h3 class="font-semibold text-gray-900 dark:text-white">${Utils.escapeHtml(driver.name)}</h3>
                  ${driver.city ? `<span class="text-sm text-gray-500">${Utils.escapeHtml(driver.city)}/${driver.state || ""}</span>` : ""}
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  ${__("match.loadLabel")}: ${Utils.escapeHtml(load.title)}
                  <span class="mx-1.5 text-gray-300">·</span>
                  ${Utils.escapeHtml(load.origin_city)}/${load.origin_state} → ${Utils.escapeHtml(load.destination_city)}/${load.destination_state}
                </p>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-2 sm:shrink-0">
            ${vehicle ? `
              <span class="inline-flex items-center space-x-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full">
                ${Icons.truck({ class: 'w-3.5 h-3.5' })} ${vehicle.model || vehicle.type || "Veículo"}
              </span>
              <span class="inline-flex items-center space-x-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full">
                ${Icons.weight({ class: 'w-3.5 h-3.5' })} ${Utils.formatNumber(vehicle.capacity_kg)} kg
              </span>
            ` : ""}              <span class="inline-flex items-center space-x-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full">
                ${Icons.calendar({ class: 'w-3.5 h-3.5' })} ${Utils.formatDate(route.departure_date)}
              </span>
          </div>
        </div>

        ${match_reasons && match_reasons.length > 0 ? `
          <div class="mt-2 flex flex-wrap gap-1.5">
            ${match_reasons.map((r) => `
              <span class="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">✓ ${r}</span>
            `).join("")}
          </div>
        ` : ""}

        <!-- Ações: Chat -->
        <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex gap-2">
          <button onclick="MatchingPage.openChat('${load?.id || ""}', '${driver?.id || ""}', '${Utils.escapeHtml(driver?.name || load?.title || "")}')"
            class="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium flex items-center space-x-1">
            ${Icons.chat({ class: 'w-3.5 h-3.5', noHover: true })}
            <span>Chat</span>
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Renderiza círculo de score colorido
   */
  _renderScoreCircle(score) {
    const color = score >= 75 ? "text-green-600" : score >= 50 ? "text-yellow-600" : score >= 25 ? "text-orange-600" : "text-gray-500";
    const bgColor = score >= 75 ? "bg-green-100 dark:bg-green-900/30" : score >= 50 ? "bg-yellow-100 dark:bg-yellow-900/30" : score >= 25 ? "bg-orange-100 dark:bg-orange-900/30" : "bg-gray-100 dark:bg-gray-700";

    return `
      <div class="w-12 h-12 ${bgColor} rounded-full flex items-center justify-center ${color} shrink-0">
        <span class="text-sm font-bold">${score}%</span>
      </div>
    `;
  },

  /**
   * Renderiza estado vazio
   */
  _renderEmptyState() {
    const hasFilters = Object.values(this._filters).some((v) => v !== "" && v !== "loads" && v !== "desc" && v !== 0);

    return `
      <div class="glass-card rounded-xl p-12 text-center">
        <div class="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          ${hasFilters ? __("match.empty.withFilters") : __("match.empty.title")}
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          ${hasFilters
            ? __("match.empty.withFilters.desc")
            : __("match.empty.desc")}
        </p>
        ${hasFilters ? `
          <button onclick="MatchingPage.clearFilters()" class="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            ${__("action.clearFilters")}
          </button>
        ` : ""}
      </div>
    `;
  },

  // ═══ Ações dos filtros ═══════════════════════════════

  /**
   * Atualiza um filtro e refaz a busca via Router.refresh()
   * (que chama render() → _search())
   */
  setFilter(key, value) {
    this._filters[key] = value;
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

  /**
   * Remove um filtro específico
   */
  removeFilter(key) {
    this._filters[key] = "";
    Router.refresh();
  },

  /**
   * Limpa todos os filtros
   */
  clearFilters() {
    this._filters = {
      type: this._filters.type,
      q: "",
      originState: "",
      destinationState: "",
      weightMin: "",
      weightMax: "",
      dateFrom: "",
      dateTo: "",
      loadType: "",
      sortBy: "score",
      sortOrder: "desc",
      minScore: 0,
    };
    Router.refresh();
  },

  // ═══ Cargas perto de mim ═══════════════════════════

  /**
   * Busca cargas próximas usando GPS ou cidade manual
   */
  async searchNearby() {
    const statusEl = document.getElementById("nearby-status");
    const cityEl = document.getElementById("nearby-city");
    const stateEl = document.getElementById("nearby-state");
    const radiusEl = document.getElementById("nearby-radius");

    if (!statusEl) return;
    statusEl.classList.remove("hidden");
    statusEl.textContent = "Obtendo localização...";

    const city = cityEl?.value?.trim() || "";
    const state = stateEl?.value?.trim() || "";
    const radius = radiusEl?.value || "150";

    let lat, lng;

    // Tenta GPS primeiro
    if (!city && navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: false,
          });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        statusEl.textContent = `📍 GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)} — buscando cargas num raio de ${radius}km...`;
      } catch {
        statusEl.textContent = "⚠️ GPS indisponível. Digite uma cidade manualmente.";
        return;
      }
    }

    // Monta URL
    const params = new URLSearchParams();
    if (lat && lng) { params.set("lat", lat); params.set("lng", lng); }
    if (city) params.set("city", city);
    if (state) params.set("state", state);
    params.set("radius", radius);

    try {
      statusEl.textContent = "Buscando cargas próximas...";
      const data = await Api.get(`loads/nearby?${params.toString()}`);

      if (data.results?.length > 0) {
        statusEl.textContent = `✅ ${data.results.length} carga(s) encontrada(s) num raio de ${radius}km!`;
        Toast.success(`${data.results.length} carga(s) próxima(s) encontrada(s)!`);
        this._results = { results: data.results.map((r) => ({
          load: r,
          route: null,
          score: 100 - Math.min(r.distance_km / 10, 50),
          match_reasons: [`📍 ${r.distance_km}km de distância`],
        })), total: data.results.length };
        Router.refresh();
      } else {
        statusEl.textContent = "Nenhuma carga encontrada próxima. Tente aumentar o raio.";
        Toast.info("Nenhuma carga próxima encontrada.");
      }
    } catch (err) {
      statusEl.textContent = "Erro ao buscar cargas próximas.";
      Toast.error(err.message || "Erro na busca");
    }
  },

  // ═══ Anexar documento ═══════════════════════════════

  /**
   * Abre modal de upload de documento vinculado a uma carga
   */
  attachDocument(loadId, loadTitle) {
    const modalHtml = `
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Anexar documento à carga: <strong class="text-gray-900 dark:text-white">${Utils.escapeHtml(loadTitle)}</strong>
        </p>
        <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
          id="attach-dropzone"
          onclick="document.getElementById('attach-file-input').click()"
          ondragover="event.preventDefault(); this.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20')"
          ondragleave="this.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20')"
          ondrop="event.preventDefault(); MatchingPage.handleAttachDrop(event)">
          <input type="file" id="attach-file-input" class="hidden" onchange="MatchingPage.handleAttachSelect(event)" />
          <svg class="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
            <span class="text-blue-600 dark:text-blue-400">Clique para selecionar</span> ou arraste o arquivo aqui
          </p>
          <p class="text-xs text-gray-400 mt-1">PDF, imagens, DOC, XLS, TXT — até 10MB</p>
          <div id="attach-file-info" class="mt-3 hidden">
            <div class="inline-flex items-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
              <span id="attach-file-name" class="text-sm font-medium text-gray-900 dark:text-white"></span>
            </div>
          </div>
        </div>
      </div>
    `;

    Modal.open({
      title: "Anexar Documento",
      body: modalHtml,
      footer: `
        <div class="flex space-x-3">
          <button type="button" onclick="Modal.close()" class="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">Cancelar</button>
          <button type="button" onclick="MatchingPage.submitAttachDoc('${loadId}')" id="attach-submit-btn" class="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium" disabled>Enviar</button>
        </div>
      `,
    });

    this._attachFile = null;
  },

  _attachFile: null,

  handleAttachSelect(event) {
    const file = event.target.files[0];
    if (file) this._showAttachFileInfo(file);
  },

  handleAttachDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) this._showAttachFileInfo(file);
    document.getElementById("attach-dropzone")?.classList.remove("border-blue-500", "bg-blue-50", "dark:bg-blue-900/20");
  },

  _showAttachFileInfo(file) {
    this._attachFile = file;
    const btn = document.getElementById("attach-submit-btn");
    const info = document.getElementById("attach-file-info");
    const name = document.getElementById("attach-file-name");
    if (btn) btn.disabled = false;
    if (info) info.classList.remove("hidden");
    if (name) name.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  },

  async submitAttachDoc(loadId) {
    if (!this._attachFile) return;
    const btn = document.getElementById("attach-submit-btn");
    if (btn) { btn.disabled = true; btn.textContent = "Enviando..."; }

    try {
      const formData = new FormData();
      formData.append("file", this._attachFile);
      formData.append("entityType", "load");
      formData.append("entityId", loadId);

      const res = await fetch(`${CONFIG.API_BASE_URL}/documents/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${Storage.getToken()}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erro no upload");
      }

      Toast.success("Documento anexado à carga!");
      Modal.close();
      this._attachFile = null;
    } catch (err) {
      Toast.error(err.message || "Erro ao anexar");
      if (btn) { btn.disabled = false; btn.textContent = "Enviar"; }
    }
  },

  // ═══ Ordem de Serviço ══════════════════════════════

  /**
   * Abre modal para criar Ordem de Serviço
   */
  async createServiceOrder(loadId, routeId, loadTitle) {
    const user = Storage.getUser();

    // Busca dados do motorista/empresa
    let driver = null;
    let company = null;
    try {
      const driverData = await Api.get("drivers/me");
      driver = driverData;
    } catch { /* fallback */ }

    try {
      const loads = this._results.results || [];
      const result = loads.find(r => r.load?.id === loadId);
      if (result?.load?.company_id) {
        company = { id: result.load.company_id, name: result.load.company_name };
      }
    } catch { /* fallback */ }

    if (!driver) {
      Toast.error("Você precisa estar cadastrado como motorista.");
      return;
    }

    const modalHtml = `
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Criar Ordem de Serviço para: <strong class="text-gray-900 dark:text-white">${Utils.escapeHtml(loadTitle)}</strong>
        </p>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de OS</label>
          <select id="os-type" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
            <option value="text">📝 Texto (descrição livre)</option>
            <option value="pdf">📄 PDF (gerado pelo sistema)</option>
            <option value="upload">📎 Upload (arquivo personalizado)</option>
          </select>
        </div>

        <div id="os-text-field">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição / Observações</label>
          <textarea id="os-description" rows="4"
            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white"
            placeholder="Descreva os serviços, condições, valores..."></textarea>
        </div>

        <div id="os-value-field">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor (R$) — opcional</label>
          <input type="number" id="os-value" step="0.01" min="0"
            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white"
            placeholder="0,00" />
        </div>

        <div id="os-upload-field" class="hidden">
          <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer"
            onclick="document.getElementById('os-file-input').click()">
            <input type="file" id="os-file-input" class="hidden" />
            <p class="text-sm text-gray-500">Clique para fazer upload do arquivo da OS</p>
            <p class="text-xs text-gray-400 mt-1">PDF, DOC, imagens</p>
          </div>
        </div>
      </div>
    `;

    Modal.open({
      title: "Nova Ordem de Serviço",
      body: modalHtml,
      footer: `
        <div class="flex space-x-3">
          <button type="button" onclick="Modal.close()" class="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">Cancelar</button>
          <button type="button" onclick="MatchingPage.submitServiceOrder('${loadId}', '${routeId}', '${driver?.id || ""}', '${company?.id || ""}')" class="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">Criar OS</button>
        </div>
      `,
    });

    // Toggle campo de upload quando seleciona tipo upload
    document.getElementById("os-type")?.addEventListener("change", function() {
      const uploadField = document.getElementById("os-upload-field");
      uploadField.classList.toggle("hidden", this.value !== "upload");
      const textField = document.getElementById("os-text-field");
      if (this.value === "pdf") {
        textField.innerHTML = '<p class="text-sm text-blue-600 dark:text-blue-400">📄 A OS será gerada automaticamente em PDF com os dados da carga e motorista.</p>';
      } else {
        textField.innerHTML = `
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição / Observações</label>
          <textarea id="os-description" rows="4" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white" placeholder="Descreva os serviços..."></textarea>
        `;
      }
    });
  },

  /**
   * Envia a criação da Ordem de Serviço
   */
  async submitServiceOrder(loadId, routeId, driverId, companyId) {
    const type = document.getElementById("os-type")?.value || "text";
    const description = document.getElementById("os-description")?.value || "";
    const valueBrl = parseFloat(document.getElementById("os-value")?.value) || null;
    const fileInput = document.getElementById("os-file-input");

    let uploadedDocId = null;

    // Se for upload, faz upload primeiro
    if (type === "upload" && fileInput?.files[0]) {
      try {
        const formData = new FormData();
        formData.append("file", fileInput.files[0]);
        formData.append("entityType", "load");
        formData.append("entityId", loadId);

        const res = await fetch(`${CONFIG.API_BASE_URL}/documents/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${Storage.getToken()}` },
          body: formData,
        });
        if (res.ok) {
          const doc = await res.json();
          uploadedDocId = doc.id;
        }
      } catch { /* fallback */ }
    }

    // Gera PDF se for tipo pdf
    let pdfUrl = null;
    if (type === "pdf") {
      const load = this._results.results?.find(r => r.load?.id === loadId)?.load;
      const user = Storage.getUser();
      const osHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Ordem de Serviço</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; padding: 20px; }
  h1 { text-align: center; color: #2563eb; }
  .info { margin: 20px 0; }
  .info td { padding: 6px 12px; }
  .info td:first-child { font-weight: bold; color: #374151; }
  .desc { margin: 20px 0; padding: 16px; background: #f3f4f6; border-radius: 8px; white-space: pre-wrap; }
  .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
</style></head>
<body>
  <h1>ORDEM DE SERVIÇO</h1>
  <hr/>
  <table class="info">
    <tr><td>Carga:</td><td>${load?.title || loadTitle}</td></tr>
    <tr><td>Origem:</td><td>${load?.origin_city || ""}/${load?.origin_state || ""}</td></tr>
    <tr><td>Destino:</td><td>${load?.destination_city || ""}/${load?.destination_state || ""}</td></tr>
    <tr><td>Peso:</td><td>${load?.weight_kg || ""} kg</td></tr>
    <tr><td>Tipo:</td><td>${load?.type || ""}</td></tr>
    <tr><td>Motorista:</td><td>${user?.name || ""}</td></tr>
    <tr><td>Valor:</td><td>R$ ${valueBrl?.toFixed(2) || "0,00"}</td></tr>
    <tr><td>Data:</td><td>${new Date().toLocaleDateString("pt-BR")}</td></tr>
  </table>
  ${description ? `<div class="desc">${description}</div>` : ""}
  <hr/>
  <div class="footer">Documento gerado pelo OpenCargo em ${new Date().toLocaleString("pt-BR")}</div>
</body></html>`.trim();
      pdfUrl = "data:text/html;charset=utf-8," + encodeURIComponent(osHtml);
    }

    // Encontra o matchId para esta carga/rota
    let matchId = null;
    try {
      const matchData = await Api.get("matching");
      const matches = Array.isArray(matchData) ? matchData : (matchData?.data || []);
      const match = matches.find(m => m.load_id === loadId || m.loadId === loadId);
      if (match) matchId = match.id || match.match_id;
    } catch { /* fallback */ }

    try {
      await Api.post("service-orders", {
          matchId: matchId || loadId,
          loadId,
          driverId,
          companyId,
          type,
          description: description || "OS gerada pelo sistema",
          valueBrl,
          pdfUrl,
          uploadedDocId,
      });

      Toast.success("Ordem de Serviço criada com sucesso!");
      Modal.close();
    } catch (err) {
      Toast.error(err.message || "Erro ao criar OS");
    }
  },

  // ═══ Chat ═════════════════════════════════════════

  /**
   * Navega para o chat, auto-selecionando o match se existir
   */
  openChat(loadId, driverId, title) {
    // Procura match existente para esta carga
    const existingMatch = (this._matches || []).find(m =>
      m.load_id === loadId || m.loadId === loadId
    );

    if (existingMatch) {
      // Match já existe — navega com o matchId para auto-selecionar
      Router.go("chat", { matchId: existingMatch.id || existingMatch.match_id });
    } else {
      // Ainda não há match — navega para o chat normalmente
      Toast.info(`💬 Envie uma mensagem sobre "${title}" após criar um match.`);
      Router.go("chat");
    }
  },

  // ═══ Fim ações ════════════════════════════════════
};
