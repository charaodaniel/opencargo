/**
 * ── OpenCargo — Router ────────────────────────────────
 * Roteador client-side responsável por:
 * - Navegação entre páginas sem recarregar
 * - Carregar páginas sob demanda
 * - Gerenciar estado da URL (hash-based)
 * - Lifecycle hooks (afterRender)
 */

const Router = {
  /** Página atualmente ativa */
  _currentPage: null,

  /** Cache de instâncias de página */
  _pageInstances: {},

  /** Container principal onde as páginas são renderizadas */
  _mainContent: null,

  /** Callbacks registrados para navegação */
  _onNavigate: [],

  /**
   * Inicializa o roteador
   * @param {string} containerId - ID do elemento container
   */
  init(containerId = "main-content") {
    this._mainContent = document.getElementById(containerId);

    // Escuta mudanças na hash da URL
    window.addEventListener("hashchange", () => this._handleRoute());

    // Roteia na carga inicial
    this._handleRoute();
  },

  /**
   * Processa a rota atual baseada na hash
   */
  async _handleRoute() {
    const hash = window.location.hash.slice(1) || "dashboard";
    await this.go(hash);
  },

  /**
   * Navega para uma página específica
   * @param {string} page - Nome da página (ex: "dashboard", "companies")
   * @param {Object} params - Parâmetros opcionais
   */
  async go(page, params = {}) {
    if (!this._mainContent) {
      console.error("Router não inicializado. Chame Router.init() primeiro.");
      return;
    }

    // Atualiza a URL se não veio de hashchange
    if (window.location.hash !== `#${page}`) {
      window.location.hash = `#${page}`;
    }

    try {
      this._mainContent.innerHTML = this._loadingSkeleton(page);
      this._currentPage = page;

      // Carrega o módulo da página
      const pageModule = await this._loadPage(page);

      // ═══ Guard: se a hash mudou durante o carregamento, ignora esta navegação ═══
      const currentHash = window.location.hash.slice(1) || "";
      if (currentHash !== page && !(currentHash === "" && page === "dashboard")) {
        console.warn(`[Router] Navegação obsoleta: "${page}" ignorada (hash atual: "${currentHash}")`);
        return;
      }

      const html = await pageModule.render(params);
      this._mainContent.innerHTML = html;

      // Chama afterRender se existir
      if (pageModule.afterRender) {
        pageModule.afterRender();
      }

      // Notifica callbacks de navegação
      this._onNavigate.forEach((cb) => cb(page, params));
    } catch (error) {
      // ═══ Guard contra navegação obsoleta no catch também ═══
      const currentHash = window.location.hash.slice(1) || "";
      if (currentHash !== page && !(currentHash === "" && page === "dashboard")) {
        console.warn(`[Router] Erro ignorado — navegação obsoleta: "${page}"`);
        return;
      }
      console.error(`Erro ao carregar página "${page}":`, error);
      this._mainContent.innerHTML = this._errorState(page);
    }
  },

  /**
   * Recarrega a página atual
   */
  refresh() {
    if (this._currentPage) {
      this.go(this._currentPage);
    }
  },

  /**
   * Registra callback para navegação
   * @param {Function} callback
   */
  onNavigate(callback) {
    this._onNavigate.push(callback);
  },

  /**
   * Carrega o módulo da página
   * @param {string} pageName
   * @returns {Object} Módulo da página
   */
  async _loadPage(pageName) {
    // Mapeia nomes de página para nomes de módulo
    const pageMap = {
      dashboard: "dashboard",
      companies: "companies",
      drivers: "drivers",
      vehicles: "vehicles",
      routes: "routes",
      loads: "loads",
      matching: "matching",
      chat: "chat",
      documents: "documents",
      freights: "freights",
      logs: "logs",
      notifications: "notifications",
      reviews: "reviews",
      maps: "maps",
      landing: "landing",
      login: "login",
      profile: "profile",
      settings: "settings",
      "admin-users": "admin-users",
      alerts: "alerts",
      audit: "audit",
      "docs": "docs-page",
      company: "company-dashboard",
    };

    const moduleName = pageMap[pageName] || "dashboard";

    // Verifica cache
    if (this._pageInstances[moduleName]) {
      return this._pageInstances[moduleName];
    }

    // Carrega dinamicamente (os scripts já foram carregados via HTML)
    const globalMap = {
      dashboard: "DashboardPage",
      companies: "CompaniesPage",
      drivers: "DriversPage",
      vehicles: "VehiclesPage",
      routes: "RoutesPage",
      loads: "LoadsPage",
      matching: "MatchingPage",
      chat: "ChatPage",
      documents: "DocumentsPage",
      freights: "FreightsPage",
      notifications: "NotificationsPage",
      reviews: "ReviewsPage",
      maps: "MapsPage",
      landing: "LandingPage",
      login: "LoginPage",
      profile: "ProfilePage",
      settings: "SettingsPage",
      "admin-users": "AdminUsersPage",
      logs: "LogsPage",
      alerts: "AlertsPage",
      audit: "AuditPage",
      "company-dashboard": "CompanyDashboardPage",
      "docs-page": "DocsPage",
    };

    const globalName = globalMap[moduleName];
    if (globalName) {
      // Tenta encontrar a página: 1) window (explicit), 2) escopo global (const/let)
      let pageModule = window[globalName];
      if (!pageModule) {
        try {
          // Indirect eval busca no escopo global (funciona com const/let)
          pageModule = (0, eval)(globalName);
        } catch { /* not found */ }
      }
      if (pageModule) {
        this._pageInstances[moduleName] = pageModule;
        return pageModule;
      }
    }

    throw new Error(`Página "${pageName}" não encontrada`);
  },

  /**
   * Skeleton loading enquanto a página carrega
   */
  _loadingSkeleton(page) {
    const titles = {
      dashboard: "Dashboard",
      companies: "Empresas",
      drivers: "Motoristas",
      vehicles: "Veículos",
      routes: "Rotas",
      loads: "Cargas",
      matching: "Matching",
      chat: "Chat",
      notifications: "Notificações",
      reviews: "Avaliações",
      logs: "Histórico",
      maps: "Mapa",
    };

    return `
      <div class="animate-pulse">
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6"></div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          ${Array(4).fill('<div class="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>').join("")}
        </div>
        <div class="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
      </div>
    `;
  },

  /**
   * Estado de erro quando página não carrega
   */
  _errorState(page) {
    return `
      <div class="text-center py-16">
        <svg class="w-20 h-20 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
        </svg>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Erro ao carregar página</h2>
        <p class="text-gray-500 mb-4">Não foi possível carregar "${page}". Tente novamente.</p>
        <button onclick="Router.go('dashboard')" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Voltar ao Dashboard
        </button>
      </div>
    `;
  },
};
