/**
 * ── OpenCargo — Landing Page ──────────────────────────
 * Página inicial para visitantes não autenticados.
 * Landing page institucional com chamada para ação.
 */

const LandingPage = {
  /**
   * Renderiza a landing page completa
   */
  render() {
    return `
      <div class="min-h-screen bg-white dark:bg-gray-900">
        ${this._navbar()}
        ${this._hero()}
        ${this._stats()}
        ${this._features()}
        ${this._howItWorks()}
        ${this._cta()}
        ${this._footer()}
      </div>
    `;
  },

  /**
   * Navbar da landing
   */
  _navbar() {
    return `
      <nav class="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <!-- Logo -->
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <span class="text-lg font-bold text-gray-900 dark:text-white">OpenCargo</span>
            </div>

            <!-- Links -->
            <div class="hidden md:flex items-center gap-8">
              <a href="javascript:void(0)" onclick="document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })" class="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Funcionalidades</a>
              <a href="javascript:void(0)" onclick="document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })" class="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Como Funciona</a>
              <a href="https://github.com/charaodaniel/opencargo" target="_blank" class="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">GitHub</a>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-3">
              <button onclick="Router.go('login')" class="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-4 py-2">
                Entrar
              </button>
              <button onclick="Router.go('login')" class="text-sm font-medium bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25">
                Cadastre-se
              </button>
            </div>
          </div>
        </div>
      </nav>
    `;
  },

  /**
   * Hero section com gradiente
   */
  _hero() {
    return `
      <section class="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <!-- Background gradient -->
        <div class="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800"></div>
        <div class="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl"></div>

        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-4xl mx-auto fade-in">
            <!-- Badge -->
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-8">
              <span class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              Plataforma Open Source de Logística Colaborativa
            </div>

            <!-- Headline -->
            <h1 class="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
              Reduza viagens vazias e<br/>
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">otimize seu transporte</span>
            </h1>

            <!-- Subheadline -->
            <p class="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Conecte cargas disponíveis com caminhões que já realizarão determinada rota.
              Reduza custos, aumente a eficiência e diminua a emissão de CO₂.
            </p>

            <!-- CTA Buttons -->
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onclick="Router.go('login')" class="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5">
                Começar Agora
                <svg class="inline-block w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </button>
              <a href="javascript:void(0)" onclick="document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })" class="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-lg font-semibold rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all hover:shadow-lg hover:-translate-y-0.5">
                Saiba Mais
              </a>
            </div>

            <!-- Mockup / Illustration -->
            <div class="mt-16 relative">
              <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-4xl mx-auto">
                <div class="flex items-center gap-2 mb-4">
                  <div class="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div class="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div class="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span class="text-xs text-gray-400 ml-2">opencargo.app</span>
                </div>
                <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 md:p-6">
                  <div class="grid grid-cols-3 gap-4 mb-4">
                    <div class="h-20 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 rounded-lg flex items-center justify-center">
                      <span class="text-2xl">📦</span>
                    </div>
                    <div class="h-20 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 rounded-lg flex items-center justify-center">
                      <span class="text-2xl">🚛</span>
                    </div>
                    <div class="h-20 bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20 rounded-lg flex items-center justify-center">
                      <span class="text-2xl">🗺️</span>
                    </div>
                  </div>
                  <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                  <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  },

  /**
   * Seção de estatísticas
   */
  _stats() {
    return `
      <section class="py-16 bg-white dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8 fade-in">
            <div class="text-center">
              <div class="text-4xl font-bold text-blue-600 mb-2">100%</div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Open Source</p>
            </div>
            <div class="text-center">
              <div class="text-4xl font-bold text-blue-600 mb-2">38</div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Testes Automatizados</p>
            </div>
            <div class="text-center">
              <div class="text-4xl font-bold text-blue-600 mb-2">9</div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Tabelas no Banco</p>
            </div>
            <div class="text-center">
              <div class="text-4xl font-bold text-blue-600 mb-2">0</div>
              <p class="text-sm text-gray-600 dark:text-gray-400">APIs Pagas</p>
            </div>
          </div>
        </div>
      </section>
    `;
  },

  /**
   * Seção de funcionalidades
   */
  _features() {
    const features = [
      {
        icon: "🔗",
        title: "Matching Inteligente",
        desc: "Algoritmo que conecta automaticamente cargas a motoristas com rotas compatíveis, priorizando fretes de retorno.",
      },
      {
        icon: "💬",
        title: "Chat em Tempo Real",
        desc: "Comunicação direta entre empresa e motorista via WebSocket após o match, sem sair da plataforma.",
      },
      {
        icon: "🗺️",
        title: "Mapa Interativo",
        desc: "Visualize rotas, cargas e cidades no mapa com Leaflet + OpenStreetMap. Clustering automático para grandes volumes.",
      },
      {
        icon: "🔐",
        title: "Autenticação Segura",
        desc: "JWT + bcrypt para proteger seus dados. Controle de acesso por papel (admin, empresa, motorista).",
      },
      {
        icon: "📊",
        title: "Dashboard Completo",
        desc: "Visão geral do sistema com estatísticas, gráficos e ações rápidas para o dia a dia.",
      },
      {
        icon: "🐳",
        title: "100% Self-Hosted",
        desc: "Instale no seu próprio servidor com Docker. Sem dependência de serviços pagos ou terceiros.",
      },
    ];

    return `
      <section id="features" class="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16 fade-in">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Funcionalidades completas para conectar cargas e motoristas de forma eficiente.
            </p>
          </div>

          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            ${features
              .map(
                (f) => `
              <div class="group bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 transition-all hover:shadow-xl hover:-translate-y-1 card-hover">
                <div class="text-4xl mb-4">${f.icon}</div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">${f.title}</h3>
                <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">${f.desc}</p>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </section>
    `;
  },

  /**
   * Seção "Como Funciona"
   */
  _howItWorks() {
    const steps = [
      {
        number: "01",
        title: "Empresa cadastra carga",
        desc: "A empresa informa origem, destino, peso, volume e datas da carga que precisa transportar.",
        icon: "📦",
      },
      {
        number: "02",
        title: "Motorista cadastra rota",
        desc: "O motorista informa sua rota programada e a capacidade ociosa disponível no veículo.",
        icon: "🛣️",
      },
      {
        number: "03",
        title: "Sistema faz o match",
        desc: "O algoritmo encontra combinações perfeitas: carga + rota de retorno com capacidade disponível.",
        icon: "🔗",
      },
      {
        number: "04",
        title: "Negociação e entrega",
        desc: "Empresa e motorista conversam pelo chat, aceitam a proposta e realizam o transporte.",
        icon: "✅",
      },
    ];

    return `
      <section id="how-it-works" class="py-20 bg-white dark:bg-gray-900">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16 fade-in">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Como funciona
            </h2>
            <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Em quatro passos simples, sua carga encontra o transporte ideal.
            </p>
          </div>

          <div class="grid md:grid-cols-4 gap-8 relative">
            <!-- Linha conectando os passos (desktop) -->
            <div class="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 dark:from-blue-800/30 dark:via-indigo-800/30 dark:to-purple-800/30"></div>

            ${steps
              .map(
                (s, i) => `
              <div class="relative text-center fade-in" style="animation-delay: ${i * 0.1}s">
                <div class="relative z-10 w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <span class="text-3xl">${s.icon}</span>
                  <div class="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center border-2 border-blue-500">
                    <span class="text-xs font-bold text-blue-600">${s.number}</span>
                  </div>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">${s.title}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">${s.desc}</p>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </section>
    `;
  },

  /**
   * CTA final
   */
  _cta() {
    return `
      <section class="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden">
        <div class="absolute inset-0">
          <div class="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div class="absolute bottom-10 right-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 class="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para otimizar seu transporte?
          </h2>
          <p class="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">
            Junte-se ao OpenCargo e comece a reduzir viagens vazias, economizar combustível e aumentar seus ganhos.
          </p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onclick="Router.go('login')" class="px-8 py-4 bg-white text-blue-700 text-lg font-semibold rounded-xl hover:bg-blue-50 transition-all shadow-xl hover:-translate-y-0.5">
              Criar Conta Gratuita
              <svg class="inline-block w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </button>
            <a href="https://github.com/charaodaniel/opencargo" target="_blank" class="px-8 py-4 bg-blue-500/30 text-white text-lg font-semibold rounded-xl border border-white/20 hover:bg-blue-500/40 transition-all">
              <svg class="inline-block w-5 h-5 mr-2 -mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Ver no GitHub
            </a>
          </div>
        </div>
      </section>
    `;
  },

  /**
   * Footer
   */
  _footer() {
    return `
      <footer class="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div class="flex items-center gap-2 mb-4">
                <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <span class="text-lg font-bold text-gray-900 dark:text-white">OpenCargo</span>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Plataforma open source para logística colaborativa. Reduzindo viagens vazias e otimizando o transporte.
              </p>
            </div>
            <div>
              <h4 class="font-semibold text-gray-900 dark:text-white mb-4">Produto</h4>
              <ul class="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li><a href="javascript:void(0)" onclick="document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Funcionalidades</a></li>
                <li><a href="javascript:void(0)" onclick="document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Como Funciona</a></li>
                <li><button onclick="Router.go('login')" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Login</button></li>
              </ul>
            </div>
            <div>
              <h4 class="font-semibold text-gray-900 dark:text-white mb-4">Desenvolvedor</h4>
              <ul class="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li><a href="https://github.com/charaodaniel/opencargo" target="_blank" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">GitHub</a></li>
                <li><a href="docs/API.md" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">API Docs</a></li>
                <li><a href="docs/CONTRIBUTING.md" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contribuir</a></li>
              </ul>
            </div>
            <div>
              <h4 class="font-semibold text-gray-900 dark:text-white mb-4">Tecnologias</h4>
              <ul class="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li>Node.js + Fastify</li>
                <li>PostgreSQL / SQLite</li>
                <li>Leaflet + OpenStreetMap</li>
                <li>Tailwind CSS + Alpine.js</li>
              </ul>
            </div>
          </div>
          <div class="border-t border-gray-200 dark:border-gray-700 pt-8 text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              © ${new Date().getFullYear()} OpenCargo. MIT License. Feito com ❤️ para reduzir viagens vazias.
            </p>
          </div>
        </div>
      </footer>
    `;
  },
};
