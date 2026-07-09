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
      <nav class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 relative">
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
            <!-- Language switcher -->
            <div class="relative" x-data="{ open: false }">
              <button onclick="Navbar.toggleLang()" 
                class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                title="${__("lang.switch")}">
                ${I18n.locale === "pt-BR" ? "🇧🇷" : "🇺🇸"}
                <span class="hidden lg:inline ml-1">${I18n.locale === "pt-BR" ? "PT" : "EN"}</span>
              </button>
              <div id="lang-menu" class="hidden absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                <button onclick="Navbar.setLang('pt-BR')" 
                  class="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 ${I18n.locale === 'pt-BR' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'}">
                  <span>🇧🇷</span>
                  <span>${__("lang.ptBr")}</span>
                </button>
                <button onclick="Navbar.setLang('en')" 
                  class="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 ${I18n.locale === 'en' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'}">
                  <span>🇺🇸</span>
                  <span>${__("lang.en")}</span>
                </button>
              </div>
            </div>

            <!-- Notifications bell -->
            <button onclick="Router.go('notifications')" class="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="${__("page.notifications")}">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              <span id="notification-badge" class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold hidden">0</span>
            </button>

            <!-- Theme toggle -->
            <button data-toggle-theme onclick="Navbar.toggleTheme()" class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="${__("theme.toggle")}">
              <svg class="w-5 h-5 block dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
              </svg>
              <svg class="w-5 h-5 hidden dark:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            </button>

            <!-- User profile -->
            <div class="relative group">
              <button class="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style="background-color: ${Utils.getAvatarColor(user.name)}">
                  ${Utils.getInitials(user.name)}
                </div>
                <div class="hidden md:block text-left">
                  <p class="text-sm font-medium text-gray-900 dark:text-white leading-tight">${Utils.escapeHtml(user.name)}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">${__(user.role ? "role." + user.role : "role.driver")}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
        <!-- Scroll Progress Bar -->
        <div id="scroll-progress" class="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-150 ease-out" style="width:0%"></div>
      </nav>
    `;
  },

  /**
   * Alterna o menu de idiomas
   */
  toggleLang() {
    const menu = document.getElementById("lang-menu");
    if (menu) {
      menu.classList.toggle("hidden");
      // Fecha ao clicar fora
      const close = (e) => {
        if (!e.target.closest("#lang-menu") && !e.target.closest("button[onclick*='toggleLang']")) {
          menu.classList.add("hidden");
          document.removeEventListener("click", close);
        }
      };
      setTimeout(() => document.addEventListener("click", close), 10);
    }
  },

  /**
   * Altera o idioma e recarrega tudo (Navbar + Sidebar + conteúdo)
   */
  setLang(locale) {
    I18n.setLocale(locale);
    // Recarrega a página inteira para garantir que todos os
    // componentes (Navbar, Sidebar, página atual) sejam
    // renderizados com o novo idioma
    window.location.reload();
  },

  /**
   * Alterna entre tema claro e escuro
   */
  toggleTheme() {
    const isDark = document.documentElement.classList.toggle("dark");
    Storage.setTheme(isDark ? "dark" : "light");

    // Animação de rotação no botão de tema
    const toggleBtn = document.querySelector('[data-toggle-theme]');
    if (toggleBtn) {
      toggleBtn.classList.remove("theme-spin");
      // Força reflow para reiniciar a animação
      void toggleBtn.offsetWidth;
      toggleBtn.classList.add("theme-spin");
      // Remove a classe quando a animação terminar (mais robusto que setTimeout)
      toggleBtn.addEventListener("animationend", () => {
        toggleBtn.classList.remove("theme-spin");
      }, { once: true });
    }
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
