/**
 * ── OpenCargo — Application ───────────────────────────
 * Ponto de entrada da aplicação.
 * Responsável por:
 * - Inicializar componentes globais
 * - Verificar autenticação
 * - Renderizar layout principal ou tela de login
 * - Aplicar tema salvo
 */

const App = {
  /**
   * Inicializa a aplicação
   */
  async initialize() {
    // Aplica tema salvo
    this._applyTheme();

    // Verifica se usuário está logado
    const isLoggedIn = Storage.isLoggedIn();

    if (isLoggedIn) {
      // Valida o token com a API antes de renderizar o app
      const tokenValid = await this._validateToken();
      if (tokenValid) {
        await this._renderApp();
      } else {
        Storage.logout();
        this._renderLanding();
      }
    } else {
      this._renderLanding();
    }
  },

  /**
   * Valida o token JWT com o backend
   * @returns {Promise<boolean>}
   */
  async _validateToken() {
    try {
      const token = Storage.getToken();
      if (!token) return false;

      const res = await fetch(`${CONFIG.API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) return false;

      const user = await res.json();
      Storage.setUser(user);
      return true;
    } catch {
      // Se a API não estiver disponível (dev), mantém sessão local
      return Storage.isLoggedIn();
    }
  },

  /**
   * Renderiza a aplicação completa (logado)
   */
  async _renderApp() {
    const root = document.getElementById("app");
    const currentPage = window.location.hash.slice(1) || "dashboard";

    const isCollapsed = Storage.get("sidebar_collapsed", false);
    const sidebarWidth = isCollapsed ? "4rem" : "16rem";

    root.innerHTML = `
      <div class="min-h-screen bg-background">
        <!-- Sidebar -->
        ${Sidebar.render(currentPage)}

        <!-- Main wrapper -->
        <div class="sidebar-content-wrapper flex flex-col min-h-screen transition-all duration-300" style="--sidebar-width: ${sidebarWidth}">
          <!-- Navbar -->
          ${Navbar.render()}

          <!-- Main content -->
          <main id="main-content" class="flex-1 p-4 lg:p-8">
            <!-- Conteúdo carregado dinamicamente -->
          </main>
        </div>
      </div>
    `;

    // Inicializa o roteador
    Router.init("main-content");

    // Inicializa barra de progresso de scroll
    this._initScrollProgress();

    // Atualiza badge de notificações
    Navbar.updateNotificationBadge();

    // Registra callbacks para navegação entre páginas
    Router.onNavigate((page) => {
      Sidebar.updateActive(page);
      Navbar.updateNotificationBadge();
      // Atualiza a barra de progresso após o novo conteúdo ser renderizado
      setTimeout(() => App._updateScrollProgress(), 50);
    });

    Toast.success(__("message.welcome"));
  },

  /**
   * Renderiza landing page para visitantes não autenticados
   */
  _renderLanding() {
    const root = document.getElementById("app");
    window.LandingPage = LandingPage;
    root.innerHTML = `<div id="main-content"></div>`;
    // Define a hash ANTES de inicializar o Router para que _handleRoute()
    // já leia "#landing" em vez de assumir "dashboard" por padrão.
    window.location.hash = "#landing";
    Router.init("main-content");
  },

  /**
   * Inicializa a barra de progresso de scroll
   * A barra fica abaixo da navbar e preenche conforme o usuário rola a página
   */
  /**
   * Atualiza a largura da barra de progresso com base no scroll
   */
  _updateScrollProgress() {
    const bar = document.getElementById("scroll-progress");
    if (!bar) return;

    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;

    if (docHeight <= 0) {
      bar.style.width = "0%";
      return;
    }

    const progress = Math.min((scrollTop / docHeight) * 100, 100);
    bar.style.width = `${progress}%`;
  },

  /**
   * Inicializa a barra de progresso de scroll
   * A barra fica abaixo da navbar e preenche conforme o usuário rola a página
   */
  _initScrollProgress() {
    // Atualiza ao rolar
    window.addEventListener("scroll", () => this._updateScrollProgress(), { passive: true });

    // Primeira atualização após um pequeno delay para garantir que o
    // DOM da página foi renderizado
    setTimeout(updateProgress, 100);
  },

  /**
   * Aplica o tema salvo (claro/escuro)
   */
  _applyTheme() {
    const theme = Storage.getTheme();
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  },
};

/**
 * Registra o Service Worker para PWA
 */
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        console.log("✅ Service Worker registrado:", registration.scope);

        // Verifica se há atualização pendente
        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener("statechange", () => {
              if (
                installingWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // Nova versão disponível
                Toast.info(__("message.newVersion"));
              }
            });
          }
        });
      } catch (error) {
        console.warn("❌ Service Worker registration failed:", error);
      }
    });
  }
}

// ── Inicializa quando o DOM estiver pronto ────────────
document.addEventListener("DOMContentLoaded", () => {
  registerServiceWorker();
  App.initialize();
});

