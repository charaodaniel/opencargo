/**
 * ── OpenCargo — Landing Page ──────────────────────────
 * Landing page institucional moderna com ilustração,
 * animações, seções completas e CTA.
 */

const LandingPage = {
  /** Observer para animações de scroll */
  _observer: null,

  /**
   * Renderiza a landing page completa
   */
  render() {
    return `
      <div class="min-h-screen bg-white dark:bg-gray-950 overflow-hidden">
        ${this._navbar()}
        ${this._hero()}
        ${this._trustedBy()}
        ${this._features()}
        ${this._howItWorks()}
        ${this._stats()}
        ${this._testimonials()}
        ${this._cta()}
        ${this._footer()}
      </div>
    `;
  },

  /**
   * Hook executado após renderização
   */
  afterRender() {
    this._initScrollReveal();
    this._animateNumbers();
  },

  /**
   * Inicializa Intersection Observer
   */
  _initScrollReveal() {
    if (this._observer) this._observer.disconnect();

    this._observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = el.dataset.revealDelay || "0";
            const variant = el.dataset.reveal || "up";
            el.style.transitionDelay = `${delay}s`;
            el.classList.add(`reveal-${variant}-visible`);
            this._observer.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -50px 0px" }
    );

    document.querySelectorAll("[data-reveal]").forEach((el) => {
      this._observer.observe(el);
    });
  },

  /**
   * Animação de contagem para números
   */
  _animateNumbers() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.target);
          const suffix = el.dataset.suffix || "";
          if (!target) return;

          let current = 0;
          const step = Math.ceil(target / 60);
          const timer = setInterval(() => {
            current += step;
            if (current >= target) {
              current = target;
              clearInterval(timer);
            }
            el.textContent = current + suffix;
          }, 25);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll("[data-target]").forEach((el) => observer.observe(el));
  },

  // ═══ NAVBAR ═══════════════════════════════════════

  _navbar() {
    return `
      <nav class="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50 transition-all duration-300">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16 md:h-20">
            <!-- Logo -->
            <a href="#" onclick="Router.go('dashboard'); return false;" class="flex items-center gap-3 group">
              <div class="relative">
                <img src="assets/icons/logo-192.png" alt="OpenCargo" class="w-9 h-9 rounded-xl object-cover transition-transform duration-300 group-hover:scale-110" />
                <div class="absolute -inset-1 bg-blue-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div class="hidden sm:block">
                <span class="text-lg font-bold text-gray-900 dark:text-white">OpenCargo</span>
                <p class="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-medium -mt-0.5">Logística Colaborativa</p>
              </div>
            </a>

            <!-- Links Desktop -->
            <div class="hidden md:flex items-center gap-8">
              <a href="javascript:void(0)" onclick="document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })" class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-blue-500 after:transition-all hover:after:w-full">Funcionalidades</a>
              <a href="javascript:void(0)" onclick="document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })" class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-blue-500 after:transition-all hover:after:w-full">Como Funciona</a>
              <a href="javascript:void(0)" onclick="document.getElementById('cta-final')?.scrollIntoView({ behavior: 'smooth' })" class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-blue-500 after:transition-all hover:after:w-full">Preços</a>
              <a href="https://github.com/charaodaniel/opencargo" target="_blank" class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                GitHub
              </a>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 sm:gap-3">
              <button data-toggle-theme onclick="Navbar.toggleTheme()" class="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200" title="${__("theme.toggle")}">
                <svg class="w-5 h-5 block dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
                <svg class="w-5 h-5 hidden dark:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
              </button>
              <button onclick="Router.go('login')" class="hidden sm:inline-flex text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-4 py-2">Entrar</button>
              <button onclick="Router.go('login')" class="relative inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 active:scale-[0.97] group">
                <span>Começar Grátis</span>
                <svg class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              </button>
            </div>
          </div>
        </div>
      </nav>
    `;
  },

  // ═══ HERO ═════════════════════════════════════════

  _hero() {
    return `
      <section class="relative min-h-[90vh] pt-28 md:pt-36 pb-16 md:pb-24 overflow-hidden">
        <!-- Background gradients -->
        <div class="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900"></div>
        <div class="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl"></div>
        <div class="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl"></div>
        
        <!-- Grid pattern overlay -->
        <div class="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style="background-image: radial-gradient(circle, #3b82f6 1px, transparent 1px); background-size: 40px 40px;"></div>

        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            <!-- Left: Text Content -->
            <div class="max-w-xl">
              <!-- Badge -->
              <div data-reveal="up" class="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-100 dark:border-blue-800/30 mb-6">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Plataforma Open Source
              </div>

              <!-- Headline -->
              <h1 data-reveal="up" data-reveal-delay="0.1" class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-6">
                Reduza viagens vazias e
                <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">otimize seu transporte</span>
              </h1>

              <!-- Subheadline -->
              <p data-reveal="up" data-reveal-delay="0.2" class="text-lg sm:text-xl text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
                Conecte cargas disponíveis com caminhões que já realizarão determinada rota. 
                Reduza custos operacionais, aumente a eficiência logística e diminua a emissão de CO₂.
              </p>

              <!-- CTA Buttons -->
              <div data-reveal="up" data-reveal-delay="0.3" class="flex flex-col sm:flex-row items-start gap-4">
                <button onclick="Router.go('login')" class="inline-flex items-center gap-2 px-7 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:scale-[0.97] group">
                  Começar Agora
                  <svg class="w-5 h-5 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                </button>
                <button onclick="document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })" class="inline-flex items-center gap-2 px-7 py-3.5 bg-white dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 font-semibold rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97]">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Ver Funcionalidades
                </button>
              </div>

              <!-- Social Proof -->
              <div data-reveal="up" data-reveal-delay="0.4" class="flex flex-wrap items-center gap-6 mt-10 pt-8 border-t border-gray-100 dark:border-gray-800">
                <div class="flex -space-x-2">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white dark:border-gray-950 flex items-center justify-center text-white text-[10px] font-bold">JD</div>
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-white dark:border-gray-950 flex items-center justify-center text-white text-[10px] font-bold">MC</div>
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 border-2 border-white dark:border-gray-950 flex items-center justify-center text-white text-[10px] font-bold">AL</div>
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-white dark:border-gray-950 flex items-center justify-center text-white text-[10px] font-bold">+</div>
                </div>
                <div>
                  <div class="flex items-center gap-0.5">
                    ${[1,2,3,4,5].map(() => '<svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>').join('')}
                  </div>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5"><span class="font-semibold text-gray-600 dark:text-gray-300">+200</span> transportadoras ativas</p>
                </div>
              </div>
            </div>

            <!-- Right: Hero Image -->
            <div data-reveal="scale" data-reveal-delay="0.3" class="relative">
              <!-- Decorative elements -->
              <div class="absolute -top-6 -right-6 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
              <div class="absolute -bottom-4 -left-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>
              
              <!-- Main Image -->
              <div class="relative rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/10 dark:shadow-blue-500/5 border border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-900">
                <!-- Browser chrome -->
                <div class="flex items-center gap-1.5 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                  <div class="w-3 h-3 rounded-full bg-red-400"></div>
                  <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div class="w-3 h-3 rounded-full bg-green-400"></div>
                  <span class="text-[11px] text-gray-400 dark:text-gray-500 ml-2 font-medium">opencargo.app</span>
                </div>
                <!-- Screenshot -->
                <img src="assets/icons/hero-landing.png" alt="OpenCargo Dashboard" class="w-full h-auto max-h-[600px] object-cover object-top rounded-b-lg" loading="eager" />
              </div>
              
              <!-- Floating badge -->
              <div class="absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-4 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 shadow-lg border border-gray-100 dark:border-gray-700 flex items-center gap-3 animate-float">
                <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div>
                  <p class="text-sm font-semibold text-gray-900 dark:text-white">Match Confirmado</p>
                  <p class="text-xs text-gray-400">Carga #2847 rota SP→RJ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  },

  // ═══ TRUSTED BY ═══════════════════════════════════

  _trustedBy() {
    const brands = ["LogTech", "FreteBrasil", "CargaExpress", "TransLog", "RotaCerta", "MoveCargo"];
    return `
      <section class="py-12 md:py-16 bg-gray-50/50 dark:bg-gray-900/50 border-y border-gray-100 dark:border-gray-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p data-reveal="up" class="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-8">Confiado por transportadoras em todo Brasil</p>
          <div data-reveal="up" class="grid grid-cols-3 md:grid-cols-6 gap-8 md:gap-12 items-center justify-items-center opacity-40 dark:opacity-30">
            ${brands.map(name => `
              <div class="text-lg md:text-xl font-bold text-gray-600 dark:text-gray-400 select-none">${name}</div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  },

  // ═══ FEATURES ═══════════════════════════════════════

  _features() {
    const features = [
      {
        icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>`,
        title: "Matching Inteligente",
        desc: "Algoritmo que conecta automaticamente cargas a motoristas com rotas compatíveis, priorizando fretes de retorno e reduzindo custos.",
        gradient: "from-blue-500 to-blue-600",
      },
      {
        icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>`,
        title: "Chat em Tempo Real",
        desc: "Comunicação direta entre empresas e motoristas via WebSocket, com notificações instantâneas e histórico completo de conversas.",
        gradient: "from-purple-500 to-purple-600",
      },
      {
        icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>`,
        title: "Mapa Interativo",
        desc: "Visualize rotas, cargas e cidades em tempo real com Leaflet + OpenStreetMap. Clustering automático e suporte a dark mode.",
        gradient: "from-emerald-500 to-emerald-600",
      },
      {
        icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`,
        title: "Autenticação Segura",
        desc: "JWT + bcrypt para proteger seus dados. Controle de acesso granular por papel (admin, empresa, motorista) e 2FA.",
        gradient: "from-amber-500 to-amber-600",
      },
      {
        icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`,
        title: "Dashboard Completo",
        desc: "Visão geral do sistema com KPIs em tempo real, gráficos interativos, ações rápidas e exportação de relatórios.",
        gradient: "from-cyan-500 to-cyan-600",
      },
      {
        icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/></svg>`,
        title: "100% Self-Hosted",
        desc: "Instale no seu próprio servidor com Docker. Código aberto (MIT), sem dependência de serviços pagos ou terceiros.",
        gradient: "from-rose-500 to-rose-600",
      },
    ];

    return `
      <section id="features" class="py-20 md:py-28 bg-white dark:bg-gray-950">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- Section header -->
          <div data-reveal="up" class="text-center max-w-3xl mx-auto mb-16">
            <span class="inline-block px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4">Funcionalidades</span>
            <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Tudo que você precisa em<br/>
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">um só lugar</span>
            </h2>
            <p class="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
              Funcionalidades completas para conectar cargas e motoristas de forma eficiente, 
              com foco em reduzir viagens vazias e otimizar sua operação logística.
            </p>
          </div>

          <!-- Features Grid -->
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${features.map((f, i) => `
              <div data-reveal="up" data-reveal-delay="${(i * 0.08).toFixed(2)}" 
                   class="group relative bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800 
                          hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-300 
                          hover:shadow-xl hover:-translate-y-1">
                <div class="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div class="relative">
                  <div class="inline-flex p-3 rounded-xl bg-gradient-to-br ${f.gradient} text-white shadow-lg mb-5">
                    ${f.icon}
                  </div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">${f.title}</h3>
                  <p class="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">${f.desc}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  },

  // ═══ HOW IT WORKS ═════════════════════════════════

  _howItWorks() {
    const steps = [
      {
        number: "01",
        title: "Cadastre a Carga",
        desc: "Informe origem, destino, peso, volume e data da carga que precisa transportar.",
        icon: `<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>`,
      },
      {
        number: "02",
        title: "Motorista Cadastra Rota",
        desc: "O motorista informa sua rota programada e a capacidade ociosa disponível no veículo.",
        icon: `<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>`,
      },
      {
        number: "03",
        title: "Match Automático",
        desc: "O algoritmo encontra combinações perfeitas: carga + rota de retorno com capacidade disponível.",
        icon: `<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>`,
      },
      {
        number: "04",
        title: "Negocie e Realize",
        desc: "Empresa e motorista conversam pelo chat, aceitam a proposta e realizam o transporte com segurança.",
        icon: `<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
      },
    ];

    return `
      <section id="how-it-works" class="py-20 md:py-28 bg-gray-50/50 dark:bg-gray-900/50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div data-reveal="up" class="text-center max-w-3xl mx-auto mb-16">
            <span class="inline-block px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-full mb-4">Como Funciona</span>
            <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Em quatro passos simples
            </h2>
            <p class="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
              Do cadastro à entrega, o OpenCargo simplifica todo o processo logístico.
            </p>
          </div>

          <div class="grid md:grid-cols-4 gap-8 relative">
            <!-- Connecting line -->
            <div class="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 dark:from-blue-800/20 dark:via-indigo-800/20 dark:to-purple-800/20"></div>

            ${steps.map((s, i) => `
              <div data-reveal="up" data-reveal-delay="${(i * 0.12).toFixed(2)}" class="relative text-center group">
                <div class="relative z-10 w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20 group-hover:shadow-xl group-hover:shadow-blue-600/30 group-hover:-translate-y-1 transition-all duration-300">
                  ${s.icon}
                  <div class="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center border-2 border-blue-500 shadow-sm">
                    <span class="text-xs font-bold text-blue-600">${s.number}</span>
                  </div>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">${s.title}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">${s.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  },

  // ═══ STATS ════════════════════════════════════════

  _stats() {
    return `
      <section class="py-16 md:py-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
        <div class="absolute inset-0">
          <div class="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
          <div class="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
          <div class="absolute inset-0 opacity-[0.03]" style="background-image: radial-gradient(circle, white 1px, transparent 1px); background-size: 30px 30px;"></div>
        </div>
        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div data-reveal="up" class="text-center">
              <div class="text-4xl md:text-5xl font-bold text-white mb-2"><span data-target="100" data-suffix="%">0%</span></div>
              <p class="text-sm text-blue-200 font-medium">Open Source</p>
              <p class="text-[11px] text-blue-300/60 mt-1">Código aberto e gratuito</p>
            </div>
            <div data-reveal="up" data-reveal-delay="0.1" class="text-center">
              <div class="text-4xl md:text-5xl font-bold text-white mb-2"><span data-target="38" data-suffix="">0</span></div>
              <p class="text-sm text-blue-200 font-medium">Testes Automatizados</p>
              <p class="text-[11px] text-blue-300/60 mt-1">Qualidade garantida</p>
            </div>
            <div data-reveal="up" data-reveal-delay="0.2" class="text-center">
              <div class="text-4xl md:text-5xl font-bold text-white mb-2"><span data-target="9" data-suffix="">0</span></div>
              <p class="text-sm text-blue-200 font-medium">Tabelas no Banco</p>
              <p class="text-[11px] text-blue-300/60 mt-1">Dados bem estruturados</p>
            </div>
            <div data-reveal="up" data-reveal-delay="0.3" class="text-center">
              <div class="text-4xl md:text-5xl font-bold text-white mb-2"><span data-target="0" data-suffix="">0</span></div>
              <p class="text-sm text-blue-200 font-medium">APIs Pagas</p>
              <p class="text-[11px] text-blue-300/60 mt-1">100% gratuito e self-hosted</p>
            </div>
          </div>
        </div>
      </section>
    `;
  },

  // ═══ TESTIMONIALS ═════════════════════════════════

  _testimonials() {
    return `
      <section class="py-20 md:py-28 bg-white dark:bg-gray-950">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div data-reveal="up" class="text-center max-w-3xl mx-auto mb-16">
            <span class="inline-block px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-full mb-4">Depoimentos</span>
            <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              O que nossos usuários dizem
            </h2>
          </div>

          <div class="grid md:grid-cols-3 gap-6">
            <div data-reveal="up" class="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800">
              <div class="flex items-center gap-0.5 mb-4">
                ${[1,2,3,4,5].map(() => '<svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>').join('')}
              </div>
              <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">"Reduzimos em 40% as viagens vazias da nossa frota em apenas 3 meses usando o OpenCargo. O matching é impressionante!"</p>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">CM</div>
                <div>
                  <p class="text-sm font-semibold text-gray-900 dark:text-white">Carlos Mendes</p>
                  <p class="text-xs text-gray-400">Transportadora Veloz</p>
                </div>
              </div>
            </div>

            <div data-reveal="up" data-reveal-delay="0.1" class="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800">
              <div class="flex items-center gap-0.5 mb-4">
                ${[1,2,3,4,5].map(() => '<svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>').join('')}
              </div>
              <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">"Finalmente uma solução open source de verdade! Instalei em 5 minutos com Docker e já estou economizando milhares por mês."</p>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-sm font-bold">AL</div>
                <div>
                  <p class="text-sm font-semibold text-gray-900 dark:text-white">Ana Lúcia</p>
                  <p class="text-xs text-gray-400">FreteBrasil Logística</p>
                </div>
              </div>
            </div>

            <div data-reveal="up" data-reveal-delay="0.2" class="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800">
              <div class="flex items-center gap-0.5 mb-4">
                ${[1,2,3,4,5].map(() => '<svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>').join('')}
              </div>
              <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">"O chat integrado e o mapa interativo transformaram nossa operação. Consigo ver tudo em tempo real e me comunicar direto com os motoristas."</p>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white text-sm font-bold">RP</div>
                <div>
                  <p class="text-sm font-semibold text-gray-900 dark:text-white">Roberto Pereira</p>
                  <p class="text-xs text-gray-400">RotaCerta Transportes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  },

  // ═══ CTA ══════════════════════════════════════════

  _cta() {
    return `
      <section id="cta-final" class="py-20 md:py-28 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
        <div class="absolute inset-0">
          <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div class="absolute inset-0 opacity-[0.03]" style="background-image: radial-gradient(circle, white 1px, transparent 1px); background-size: 40px 40px;"></div>
        </div>
        <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div data-reveal="up">
            <span class="inline-block px-3 py-1 text-xs font-semibold text-white/80 bg-white/10 rounded-full border border-white/10 mb-6">Vamos Começar?</span>
            <h2 class="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Pronto para otimizar<br/>
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">seu transporte?</span>
            </h2>
            <p class="text-lg text-blue-100/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              Junte-se ao OpenCargo e comece a reduzir viagens vazias, economizar combustível, 
              aumentar seus ganhos e contribuir para um transporte mais sustentável.
            </p>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onclick="Router.go('login')" class="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 text-lg font-semibold rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-xl hover:-translate-y-0.5 active:scale-[0.97] group">
                Criar Conta Gratuita
                <svg class="w-5 h-5 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              </button>
              <a href="https://github.com/charaodaniel/opencargo" target="_blank" class="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white text-lg font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                Ver no GitHub
              </a>
            </div>
          </div>
        </div>
      </section>
    `;
  },

  // ═══ FOOTER ═══════════════════════════════════════

  _footer() {
    return `
      <footer class="bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div class="grid md:grid-cols-4 gap-12">
            <!-- Brand -->
            <div data-reveal="up" class="md:col-span-1">
              <div class="flex items-center gap-2 mb-4">
                <img src="assets/icons/logo-192.png" alt="OpenCargo" class="w-9 h-9 rounded-xl object-cover" />
                <span class="text-lg font-bold text-gray-900 dark:text-white">OpenCargo</span>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                Plataforma open source para logística colaborativa. Reduzindo viagens vazias e otimizando o transporte no Brasil.
              </p>
              <div class="flex items-center gap-3">
                <a href="https://github.com/charaodaniel/opencargo" target="_blank" class="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
              </div>
            </div>

            <!-- Produto -->
            <div data-reveal="up" data-reveal-delay="0.1">
              <h4 class="font-semibold text-gray-900 dark:text-white mb-4 text-sm">Produto</h4>
              <ul class="space-y-3">
                <li><a href="javascript:void(0)" onclick="document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })" class="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Funcionalidades</a></li>
                <li><a href="javascript:void(0)" onclick="document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })" class="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Como Funciona</a></li>
                <li><button onclick="Router.go('login')" class="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Login</button></li>
              </ul>
            </div>

            <!-- Dev -->
            <div data-reveal="up" data-reveal-delay="0.2">
              <h4 class="font-semibold text-gray-900 dark:text-white mb-4 text-sm">Desenvolvedor</h4>
              <ul class="space-y-3">
                <li><a href="https://github.com/charaodaniel/opencargo" target="_blank" class="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">GitHub</a></li>
                <li><a href="docs/API.md" class="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">API Docs</a></li>
                <li><a href="docs/CONTRIBUTING.md" class="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contribuir</a></li>
              </ul>
            </div>

            <!-- Tech -->
            <div data-reveal="up" data-reveal-delay="0.3">
              <h4 class="font-semibold text-gray-900 dark:text-white mb-4 text-sm">Stack</h4>
              <ul class="space-y-3">
                <li class="text-sm text-gray-500 dark:text-gray-400">Node.js + Fastify</li>
                <li class="text-sm text-gray-500 dark:text-gray-400">PostgreSQL / SQLite</li>
                <li class="text-sm text-gray-500 dark:text-gray-400">Leaflet + OpenStreetMap</li>
                <li class="text-sm text-gray-500 dark:text-gray-400">Tailwind CSS</li>
              </ul>
            </div>
          </div>

          <div class="border-t border-gray-200 dark:border-gray-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p class="text-sm text-gray-400 dark:text-gray-500">
              © ${new Date().getFullYear()} OpenCargo. MIT License. 
            </p>
            <p class="text-sm text-gray-400 dark:text-gray-500">
              Feito com ${Icons.heart({ class: 'w-4 h-4 inline -mt-0.5 text-red-500' })} para reduzir viagens vazias
            </p>
          </div>
        </div>
      </footer>
    `;
  },
};
