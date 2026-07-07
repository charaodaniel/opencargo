/**
 * ── OpenCargo — Sidebar Component ─────────────────────
 * Sidebar fixa com links de navegação.
 * Recolhe automaticamente em telas pequenas.
 */

const Sidebar = {
  /** Estado da sidebar em mobile */
  _isOpen: false,

  /** Itens do menu */
  _menuItems: [
    { icon: "dashboard", label: "Dashboard", page: "dashboard" },
    { icon: "companies", label: "Empresas", page: "companies" },
    { icon: "drivers", label: "Motoristas", page: "drivers" },
    { icon: "vehicles", label: "Veículos", page: "vehicles" },
    { icon: "routes", label: "Rotas", page: "routes" },
    { icon: "loads", label: "Cargas", page: "loads" },
    { icon: "matching", label: "Matching", page: "matching" },
    { icon: "maps", label: "Mapa", page: "maps" },
    { icon: "chat", label: "Chat", page: "chat" },
    { icon: "notifications", label: "Notificações", page: "notifications" },
    { icon: "settings", label: "Configurações", page: "settings" },
    { icon: "profile", label: "Perfil", page: "profile" },
  ],

  /**
   * Renderiza a sidebar
   * @param {string} currentPage - Página ativa
   * @returns {string} HTML da sidebar
   */
  render(currentPage = "dashboard") {
    const icons = {
      dashboard: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`,
      companies: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`,
      drivers: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`,
      vehicles: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`,
      routes: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>`,
      loads: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>`,
      matching: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>`,
      maps: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>`,
      chat: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>`,
      notifications: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>`,
    };

    return `
      <aside id="sidebar" class="fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transform -translate-x-full lg:translate-x-0 transition-transform duration-300 ease-in-out">
        <!-- Logo -->
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <a href="#" onclick="Router.go('dashboard'); return false;" class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div>
              <p class="text-lg font-bold text-gray-900 dark:text-white">OpenCargo</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Logística Colaborativa</p>
            </div>
          </a>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
          ${this._menuItems
            .map(
              (item) => `
            <button onclick="Sidebar.navigate('${item.page}')" 
              class="sidebar-link w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                currentPage === item.page
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }">
              <span class="shrink-0">${icons[item.icon] || icons.dashboard}</span>
              <span>${item.label}</span>
            </button>
          `
            )
            .join("")}
        </nav>

        <!-- Footer -->
        <div class="p-3 border-t border-gray-200 dark:border-gray-700">
          <p class="text-xs text-gray-400 dark:text-gray-500 text-center">OpenCargo v0.1.0</p>
        </div>
      </aside>

      <!-- Mobile overlay -->
      <div id="sidebar-overlay" class="fixed inset-0 z-30 bg-black bg-opacity-50 hidden lg:hidden" onclick="Sidebar.close()"></div>
    `;
  },

  /**
   * Navega para uma página
   */
  navigate(page) {
    this.close();
    Router.go(page);
  },

  /**
   * Abre/fecha a sidebar em mobile
   */
  toggle() {
    this._isOpen = !this._isOpen;
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (sidebar) sidebar.classList.toggle("-translate-x-full", !this._isOpen);
    if (overlay) overlay.classList.toggle("hidden", !this._isOpen);
  },

  /**
   * Fecha a sidebar
   */
  close() {
    this._isOpen = false;
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (sidebar) sidebar.classList.add("-translate-x-full");
    if (overlay) overlay.classList.add("hidden");
  },

  /**
   * Atualiza o item ativo na sidebar
   */
  updateActive(page) {
    document.querySelectorAll(".sidebar-link").forEach((link) => {
      const isActive = link.textContent.trim().toLowerCase() === page.toLowerCase();
      link.classList.toggle("bg-blue-50", isActive);
      link.classList.toggle("dark:bg-blue-900/30", isActive);
      link.classList.toggle("text-blue-700", isActive);
      link.classList.toggle("dark:text-blue-400", isActive);
      link.classList.toggle("font-semibold", isActive);
    });
  },
};
