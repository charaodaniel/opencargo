/**
 * ── OpenCargo — Security Alerts Page ─────────────────
 * Monitoramento de atividades suspeitas na plataforma.
 * Apenas administradores têm acesso.
 */

const AlertsPage = {
  /** Dados */
  _data: null,
  _page: 1,
  _totalPages: 1,

  async render() {
    const user = Storage.getUser();
    if (!user || user.role !== "administrador") {
      return `<div class="text-center py-16 text-gray-500">Acesso restrito a administradores.</div>`;
    }

    await this._fetchAlerts();

    return `
      <div class="fade-in">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              <svg class="w-6 h-6 inline-block mr-2 -mt-0.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
              Alertas de Segurança
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Atividades suspeitas detectadas na plataforma</p>
          </div>
        </div>

        ${this._data ? this._renderStats() : ""}

        ${this._data?.stats?.top_emails?.length > 0 ? this._renderTopFailures() : ""}

        ${this._data?.recent_failures?.length > 0 ? this._renderRecentFailures() : ""}

        ${this._data?.notifications?.length > 0 ? this._renderNotifications() : this._renderEmpty()}
      </div>
    `;
  },

  /**
   * Cards de estatísticas
   */
  _renderStats() {
    const s = this._data.stats;
    const severityColor = s.login_failed_24h > 20 ? "text-red-600" : s.login_failed_24h > 10 ? "text-orange-500" : "text-yellow-500";
    const massColor = s.mass_actions_24h > 15 ? "text-red-600" : s.mass_actions_24h > 5 ? "text-orange-500" : "text-yellow-500";

    return `
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wider font-medium">Login Falhas (24h)</p>
              <p class="text-2xl font-bold ${severityColor} mt-1">${Utils.formatNumber(s.login_failed_24h)}</p>
            </div>
            <div class="w-10 h-10 rounded-lg ${s.login_failed_24h > 20 ? "bg-red-100 dark:bg-red-900/30" : "bg-yellow-100 dark:bg-yellow-900/30"} flex items-center justify-center">
              <svg class="w-5 h-5 ${s.login_failed_24h > 20 ? "text-red-500" : "text-yellow-500"}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wider font-medium">Ações em Massa (24h)</p>
              <p class="text-2xl font-bold ${massColor} mt-1">${Utils.formatNumber(s.mass_actions_24h)}</p>
            </div>
            <div class="w-10 h-10 rounded-lg ${s.mass_actions_24h > 15 ? "bg-red-100 dark:bg-red-900/30" : "bg-orange-100 dark:bg-orange-900/30"} flex items-center justify-center">
              <svg class="w-5 h-5 ${s.mass_actions_24h > 15 ? "text-red-500" : "text-orange-500"}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wider font-medium">IPs Distintos (24h)</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">${Utils.formatNumber(s.top_ips?.length || 0)}</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Top emails com falha de login
   */
  _renderTopFailures() {
    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
          <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>Top Tentativas de Login (24h)</span>
        </h3>
        <div class="space-y-2">
          ${this._data.stats.top_emails.map(e => {
            const severity = e.count > 10 ? "text-red-600 font-semibold" : e.count > 5 ? "text-orange-500" : "text-yellow-500";
            return `
              <div class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 rounded-full ${e.count > 10 ? "bg-red-100 dark:bg-red-900/30" : "bg-yellow-100 dark:bg-yellow-900/30"} flex items-center justify-center">
                    <svg class="w-4 h-4 ${e.count > 10 ? "text-red-500" : "text-yellow-500"}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">${Utils.escapeHtml(e.email)}</p>
                    <p class="text-xs text-gray-400">${e.count} tentativas</p>
                  </div>
                </div>
                <span class="text-sm ${severity}">${e.count >= 10 ? "🔴 Crítico" : e.count >= 5 ? "🟡 Alerta" : "🟢 Baixo"}</span>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  },

  /**
   * Timeline de falhas recentes
   */
  _renderRecentFailures() {
    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
          <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>Falhas Recentes (últimas 20)</span>
        </h3>
        <div class="space-y-1">
          ${this._data.recent_failures.map(f => {
            const email = f.details?.email || "desconhecido";
            return `
              <div class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-sm">
                <div class="flex items-center space-x-3">
                  <span class="w-2 h-2 rounded-full bg-red-400"></span>
                  <span class="text-gray-900 dark:text-white font-mono text-xs">${Utils.escapeHtml(email)}</span>
                  ${f.ip ? `<span class="text-xs text-gray-400 font-mono">${f.ip}</span>` : ""}
                </div>
                <span class="text-xs text-gray-400">${Utils.formatDate(f.created_at, true)}</span>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  },

  /**
   * Notificações de alerta (sistema)
   */
  _renderNotifications() {
    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
          <svg class="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          <span>Histórico de Alertas</span>
        </h3>

        <div class="space-y-2">
          ${this._data.notifications.map(n => {
            const isCritical = n.title?.includes("crítico") || n.message?.includes("10 exclusões");
            const isWarning = n.title?.includes("alerta") || n.title?.includes("múltiplas") || n.title?.includes("massa");

            return `
              <div class="flex items-start space-x-3 p-3 rounded-lg border ${isCritical ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10" : isWarning ? "border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10" : "border-gray-200 dark:border-gray-700"} transition-colors">
                <div class="mt-0.5 shrink-0">
                  ${isCritical
                    ? `<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>`
                    : `<svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
                  }
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2">
                    <p class="text-sm font-semibold ${isCritical ? "text-red-800 dark:text-red-300" : "text-orange-800 dark:text-orange-300"}">${Utils.escapeHtml(n.title)}</p>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isCritical ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" : isWarning ? "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}">${isCritical ? "Crítico" : isWarning ? "Alerta" : "Info"}</span>
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-0.5">${Utils.escapeHtml(n.message)}</p>
                  <p class="text-xs text-gray-400 mt-1">${Utils.formatDate(n.created_at, true)}</p>
                </div>
              </div>
            `;
          }).join("")}
        </div>

        <!-- Pagination -->
        ${this._totalPages > 1 ? this._renderPagination() : ""}
      </div>
    `;
  },

  /**
   * Paginação
   */
  _renderPagination() {
    return `
      <div class="flex items-center justify-between mt-4">
        <button onclick="AlertsPage.goToPage(${this._page - 1})"
          ${this._page <= 1 ? 'disabled' : ''}
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          Voltar
        </button>
        <span class="text-sm text-gray-600 dark:text-gray-400">Página ${this._page} de ${this._totalPages}</span>
        <button onclick="AlertsPage.goToPage(${this._page + 1})"
          ${this._page >= this._totalPages ? 'disabled' : ''}
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          Próximo
        </button>
      </div>
    `;
  },

  /**
   * Estado vazio
   */
  _renderEmpty() {
    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <svg class="w-16 h-16 mx-auto mb-4 text-green-300 dark:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Nenhum alerta de segurança</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">Nenhuma atividade suspeita detectada. A plataforma está segura.</p>
      </div>
    `;
  },

  // ═══ Data fetching ═════════════════════════════════

  async _fetchAlerts(page = 1) {
    try {
      const token = Storage.getToken();
      const params = new URLSearchParams({ page, limit: 20 });
      const res = await fetch(`${CONFIG.API_BASE_URL}/logs/alerts?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Erro: ${res.status}`);

      const json = await res.json();
      this._data = json;
      this._page = json.pagination?.page || 1;
      this._totalPages = Math.ceil((json.pagination?.total || 0) / (json.pagination?.limit || 20));
    } catch {
      this._data = null;
    }
  },

  // ═══ Actions ═══════════════════════════════════════

  async goToPage(page) {
    if (page < 1 || page > this._totalPages) return;
    await this._fetchAlerts(page);
    Router.refresh();
  },
};
