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
      await this._renderApp();
    } else {
      this._renderLanding();
    }
  },

  /**
   * Renderiza a aplicação completa (logado)
   */
  async _renderApp() {
    const root = document.getElementById("app");
    const currentPage = window.location.hash.slice(1) || "dashboard";

    root.innerHTML = `
      <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <!-- Sidebar -->
        ${Sidebar.render(currentPage)}

        <!-- Main wrapper -->
        <div class="lg:ml-64 flex flex-col min-h-screen transition-all duration-300">
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

    // Atualiza badge de notificações
    Navbar.updateNotificationBadge();

    // Registra callback para atualizar sidebar/navbar ao navegar
    Router.onNavigate((page) => {
      Sidebar.updateActive(page);
      Navbar.updateNotificationBadge();
    });

    Toast.success("Bem-vindo ao OpenCargo!");
  },

  /**
   * Renderiza landing page para visitantes não autenticados
   */
  _renderLanding() {
    const root = document.getElementById("app");
    window.LandingPage = LandingPage;
    root.innerHTML = `<div id="main-content"></div>`;
    Router.init("main-content");
    Router.go("landing");
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

// ── Inicializa quando o DOM estiver pronto ────────────
document.addEventListener("DOMContentLoaded", () => {
  App.initialize();
});
