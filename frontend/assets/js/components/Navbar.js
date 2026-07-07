/**
 * ── OpenCargo — Navbar Component ──────────────────────
 * Barra de navegação superior com logo, busca,
 * notificações, perfil e toggle de tema.
 */

const Navbar = {
  /**
   * Renderiza a navbar
   * @returns {string} HTML da navbar
   */
  render() {
    const user = Storage.getUser() || { name: "Usuário", email: "usuario@opencargo.com.br" };
    const currentTheme = Storage.getTheme();

    return `
      <nav class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div class="flex items-center justify-between h-16 px-4 lg:px-6">
          <!-- Left side -->
          <div class="flex items-center space-x-4">
            <!-- Mobile menu button -->
            <button id="sidebar-toggle" onclick="Sidebar.toggle()" class="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>

            <!-- Logo (mobile) -->
            <a href="#" onclick="Router.go('dashboard'); return false;" class="lg:hidden flex items-center space-x-2">
              <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <span class="font-bold text-gray-900 dark:text-white">OpenCargo</span>
            </a>
          </div>

          <!-- Right side -->
          <div class="flex items-center space-x-3">
            <!-- Theme toggle -->
            <button onclick="Navbar.toggleTheme()" class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Alternar tema">
              <svg class="w-5 h-5 block dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
              </svg>
              <svg class="w-5 h-5 hidden dark:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            </button>

            <!-- Notifications bell -->
            <button onclick="Router.go('notifications')" class="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Notificações">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              <span id="notification-badge" class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold hidden">0</span>
            </button>

            <!-- User profile -->
            <div class="relative group">
              <button class="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style="background-color: ${Utils.getAvatarColor(user.name)}">
                  ${Utils.getInitials(user.name)}
                </div>
                <div class="hidden md:block text-left">
                  <p class="text-sm font-medium text-gray-900 dark:text-white leading-tight">${Utils.escapeHtml(user.name)}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">${user.role === "admin" ? "Administrador" : user.role === "company" ? "Empresa" : "Motorista"}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>
    `;
  },

  /**
   * Alterna entre tema claro e escuro
   */
  toggleTheme() {
    const isDark = document.documentElement.classList.toggle("dark");
    Storage.setTheme(isDark ? "dark" : "light");
  },

  /**
   * Atualiza o badge de notificações
   */
  async updateNotificationBadge() {
    try {
      const notifications = await Api.get("notifications");
      const unread = notifications.filter((n) => !n.read).length;
      const badge = document.getElementById("notification-badge");
      if (badge) {
        if (unread > 0) {
          badge.classList.remove("hidden");
          badge.textContent = unread > 9 ? "9+" : unread;
        } else {
          badge.classList.add("hidden");
        }
      }
    } catch {
      // Ignora erros
    }
  },
};
