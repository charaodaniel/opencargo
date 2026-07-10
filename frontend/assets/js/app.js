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

    try {
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
    } finally {
      // Esconde a splash screen com fade-out suave
      this._hideSplash();
    }

    // Inicializa suporte offline (fila de ações pendentes)
    this._initOfflineSupport();
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
    setTimeout(() => this._updateScrollProgress(), 100);
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

  /**
   * Esconde a splash screen com fade-out suave
   */
  _hideSplash() {
    const splash = document.getElementById("splash-screen");
    if (!splash) return;

    // Aplica classe de fade-out
    splash.classList.add("splash-hidden");

    // Remove o elemento do DOM após a animação terminar
    setTimeout(() => {
      if (splash.parentNode) {
        splash.parentNode.removeChild(splash);
      }
    }, 600);
  },

  /**
   * Inicializa listeners de online/offline e mensagens do SW
   */
  _initOfflineSupport() {
    // Listener do Service Worker para processamento da fila
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.action === "processOfflineQueue") {
        OfflineQueue.processAll();
      }
    });

    // Listener: voltou ao online → processa fila pendente
    window.addEventListener("online", () => {
      Toast.success("🌐 Conexão restabelecida!");
      const pending = OfflineQueue.count();
      if (pending > 0) {
        Toast.info(`🔄 Sincronizando ${pending} ação(ões) pendente(s)...`);
        OfflineQueue.processAll().then(() => {
          Navbar.updateOfflineBadge();
        });
      }
      Navbar.updateOfflineBadge();
    });

    // Listener: ficou offline
    window.addEventListener("offline", () => {
      Toast.warning("📡 Você está offline. As ações serão enfileiradas.");
      Navbar.updateOfflineBadge();
    });

    // Processa fila pendente na inicialização (se online)
    if (navigator.onLine) {
      const pending = OfflineQueue.count();
      if (pending > 0) {
        setTimeout(() => {
          Toast.info(`🔄 Sincronizando ${pending} ação(ões) pendente(s)...`);
          OfflineQueue.processAll();
        }, 2000);
      }
    }
  },
};

/**
 * Registra o Service Worker para PWA
 */
function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      console.log("✅ Service Worker registrado:", registration.scope);

      // Sincroniza estado do skipWaiting ao ativar
      let newWorker = null;

      registration.addEventListener("updatefound", () => {
        newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            // Nova versão disponível — exibe banner de atualização
            showUpdateBanner(registration);
          }
        });
      });

      // Fallback: SW já pode estar em waiting (instalado por outra aba)
      if (registration.waiting && navigator.serviceWorker.controller) {
        showUpdateBanner(registration);
      }

      // Escuta controle atualizado (após skipWaiting)
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    } catch (error) {
      console.warn("❌ Service Worker registration failed:", error);
    }
  });
}

/**
 * Exibe banner persistente de atualização disponível
 * O usuário pode clicar em "Atualizar agora" ou fechar
 */
function showUpdateBanner(registration) {
  const existing = document.getElementById("update-banner");
  if (existing) existing.remove();

  const banner = document.createElement("div");
  banner.id = "update-banner";
  banner.className = `
    fixed top-0 left-0 right-0 z-[9999]
    bg-blue-600 dark:bg-blue-700
    text-white
    px-4 py-3
    shadow-lg
    transform -translate-y-full
    transition-transform duration-300 ease-in-out
  `;

  banner.innerHTML = `
    <div class="max-w-7xl mx-auto flex items-center justify-between gap-4" style="padding-top: env(safe-area-inset-top, 0px)">
      <div class="flex items-center gap-3 min-w-0">
        <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        <span class="text-sm font-medium truncate">${__("message.newVersion")}</span>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button id="update-btn"
          class="px-4 py-1.5 bg-white text-blue-700 dark:bg-white dark:text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors active:scale-95">
          Atualizar agora
        </button>
        <button id="dismiss-update-btn"
          class="p-1.5 text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          aria-label="Fechar">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  document.body.prepend(banner);

  // Anima entrada
  requestAnimationFrame(() => {
    banner.classList.remove("-translate-y-full");
  });

  // Botão de atualizar
  document.getElementById("update-btn").addEventListener("click", () => {
    banner.classList.add("-translate-y-full");
    // Envia skipWaiting e recarrega via controllerchange
    if (registration.waiting) {
      registration.waiting.postMessage({ action: "skipWaiting" });
    }
  });

  // Fechar banner
  document.getElementById("dismiss-update-btn").addEventListener("click", () => {
    banner.classList.add("-translate-y-full");
    setTimeout(() => banner.remove(), 300);
  });
}

// ── Inicializa quando o DOM estiver pronto ────────────
document.addEventListener("DOMContentLoaded", () => {
  registerServiceWorker();
  App.initialize();
});

