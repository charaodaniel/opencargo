/**
 * ── OpenCargo — Notifications Page ────────────────────
 * Lista de notificações com categorias e filtros.
 */

const NotificationsPage = {
  /** Filtro ativo */
  _filter: "all",

  async render() {
    const notifications = await Api.get("notifications");
    const unreadCount = notifications.filter((n) => !n.read).length;

    const categories = [
      { key: "all", label: "Todas", count: notifications.length },
      { key: "unread", label: "Não Lidas", count: unreadCount },
      { key: "match", label: "Matches", count: notifications.filter((n) => n.type === "match").length },
      { key: "message", label: "Mensagens", count: notifications.filter((n) => n.type === "message").length },
      { key: "system", label: "Sistema", count: notifications.filter((n) => n.type === "system").length },
    ];

    const filtered = this._filter === "all"
      ? notifications
      : this._filter === "unread"
        ? notifications.filter((n) => !n.read)
        : notifications.filter((n) => n.type === this._filter);

    return `
      <div class="fade-in">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Notificações</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Suas notificações e alertas</p>
          </div>
          ${unreadCount > 0 ? `<button onclick="NotificationsPage.markAllRead()" class="text-sm text-blue-600 hover:text-blue-800 font-medium">Marcar todas como lidas</button>` : ""}
        </div>

        <!-- Categorias -->
        <div class="flex flex-wrap gap-2 mb-6">
          ${categories
            .map(
              (c) => `
            <button onclick="NotificationsPage.filter('${c.key}')" 
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                this._filter === c.key
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              }">
              ${c.label} (${c.count})
            </button>
          `
            )
            .join("")}
        </div>

        <!-- Lista -->
        <div class="space-y-3">
          ${filtered.length === 0
            ? `
            <div class="text-center py-16 text-gray-400">
              <svg class="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              <p class="text-lg font-medium">Nenhuma notificação</p>
              <p class="text-sm">Você será notificado quando houver matches ou mensagens.</p>
            </div>
          `
            : filtered
                .map(
                  (n) => `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex items-start justify-between transition-colors ${!n.read ? "border-l-4 border-l-blue-500 dark:border-l-blue-400 bg-blue-50/50 dark:bg-blue-900/10" : ""}">
              <div class="flex items-start space-x-3 flex-1">
                <span class="text-xl">${n.type === "match" ? "🔗" : n.type === "message" ? "💬" : "ℹ️"}</span>
                <div>
                  <div class="flex items-center space-x-2">
                    <p class="text-sm font-semibold text-gray-900 dark:text-white">${Utils.escapeHtml(n.title)}</p>
                    ${!n.read ? '<span class="w-2 h-2 bg-blue-500 rounded-full"></span>' : ""}
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-0.5">${Utils.escapeHtml(n.message)}</p>
                  <p class="text-xs text-gray-400 mt-1">${Utils.formatDate(n.created_at, true)}</p>
                </div>
              </div>
              ${!n.read ? `<button onclick="NotificationsPage.markRead(${n.id})" class="text-xs text-blue-600 hover:text-blue-800 font-medium ml-4 shrink-0">Ler</button>` : ""}
            </div>
          `
                )
                .join("")}
        </div>
      </div>
    `;
  },

  /**
   * Altera o filtro ativo
   */
  filter(key) {
    this._filter = key;
    Router.refresh();
  },

  /**
   * Marca notificação como lida
   */
  markRead(id) {
    Toast.info("Notificação marcada como lida");
    Router.refresh();
  },

  /**
   * Marca todas como lidas
   */
  markAllRead() {
    Toast.success("Todas as notificações marcadas como lidas");
    Router.refresh();
  },
};
