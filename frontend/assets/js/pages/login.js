/**
 * ── OpenCargo — Auth Page ─────────────────────────────
 * Página de autenticação com login e registro integrados
 * à API real (Fastify + JWT + bcrypt).
 * Layout moderno com split screen, animações e validação.
 */

const LoginPage = {
  /** Modo: 'login' ou 'register' */
  _mode: "login",

  /** Loading state */
  _loading: false,

  /**
   * Renderiza a página de login/registro
   */
  render() {
    const isLogin = this._mode === "login";

    return `
      <div class="min-h-screen flex fade-in">
        <!-- Left: Brand Panel -->
        <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
          <div class="absolute inset-0">
            <div class="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
            <div class="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl"></div>
          </div>

          <div class="relative flex flex-col justify-between p-16 w-full">
            <!-- Logo -->
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <span class="text-2xl font-bold text-white">OpenCargo</span>
            </div>

            <!-- Content -->
            <div class="space-y-6">
              <blockquote class="text-white/90 text-xl leading-relaxed font-light italic">
                "Milhares de caminhões percorrem diariamente grandes distâncias vazios.
                O OpenCargo conecta cargas a motoristas com rotas compatíveis,
                reduzindo viagens vazias e otimizando o transporte."
              </blockquote>

              <div class="flex items-center gap-4">
                <div class="flex -space-x-2">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-300 to-blue-500 border-2 border-white/30 flex items-center justify-center text-white text-sm font-bold">DC</div>
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-green-300 to-green-500 border-2 border-white/30 flex items-center justify-center text-white text-sm font-bold">JS</div>
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-300 to-purple-500 border-2 border-white/30 flex items-center justify-center text-white text-sm font-bold">ML</div>
                </div>
                <div>
                  <p class="text-white font-medium text-sm">Junta de Logística</p>
                  <p class="text-white/60 text-xs">+12 empresas ativas</p>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="text-white/40 text-sm">
              <p>Open Source · MIT License · Logística Colaborativa</p>
            </div>
          </div>
        </div>

        <!-- Right: Form Panel -->
        <div class="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white dark:bg-gray-900">
          <div class="w-full max-w-md">
            <!-- Logo mobile -->
            <div class="lg:hidden text-center mb-8">
              <div class="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">OpenCargo</h1>
              <p class="text-gray-500 dark:text-gray-400 mt-1">Logística Colaborativa</p>
            </div>

            <!-- Header -->
            <div class="mb-8">
              <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
                ${isLogin ? "Bem-vindo de volta" : "Criar conta"}
              </h2>
              <p class="text-gray-500 dark:text-gray-400 mt-2">
                ${isLogin ? "Entre com suas credenciais para acessar a plataforma." : "Preencha os dados abaixo para começar."}
              </p>
            </div>

            <!-- Form -->
            <form id="auth-form" onsubmit="LoginPage.submit(event)" class="space-y-5">

              <!-- Nome (apenas no registro) -->
              ${isLogin ? "" : `
              <div class="fade-in">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome completo</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </span>
                  <input type="text" id="auth-name" required placeholder="Seu nome completo"
                    class="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all" />
                </div>
              </div>
              `}

              <!-- Email -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">E-mail</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </span>
                  <input type="email" id="auth-email" required placeholder="seu@email.com"
                    class="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all" />
                </div>
              </div>

              <!-- Senha -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Senha</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                  </span>
                  <input type="password" id="auth-password" required minlength="6" placeholder="Mínimo 6 caracteres"
                    class="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all" />
                </div>
              </div>

              <!-- Role (apenas no registro) -->
              ${isLogin ? "" : `
              <div class="fade-in">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipo de conta</label>
                <div class="grid grid-cols-2 gap-3">
                  <label class="relative flex items-center justify-center px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-all has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20">
                    <input type="radio" name="auth-role" value="company" checked class="sr-only peer" />
                    <div class="text-center">
                      <span class="text-2xl block mb-1">🏢</span>
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300 peer-checked:text-blue-600">Empresa</span>
                    </div>
                  </label>
                  <label class="relative flex items-center justify-center px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-all has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20">
                    <input type="radio" name="auth-role" value="driver" class="sr-only peer" />
                    <div class="text-center">
                      <span class="text-2xl block mb-1">🚚</span>
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300 peer-checked:text-blue-600">Motorista</span>
                    </div>
                  </label>
                </div>
              </div>
              `}

              <!-- Submit -->
              <button type="submit" id="auth-submit" disabled
                class="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg">
                <span id="auth-submit-text">${isLogin ? "Entrar" : "Criar Conta"}</span>
                <span id="auth-submit-loading" class="hidden">
                  <svg class="animate-spin inline-block w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Aguarde...
                </span>
              </button>
            </form>

            <!-- Toggle mode -->
            <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              ${isLogin ? "Não tem conta?" : "Já tem conta?"}
              <button onclick="LoginPage.toggleMode()" class="text-blue-600 hover:text-blue-700 font-medium hover:underline ml-1">
                ${isLogin ? "Cadastre-se gratuitamente" : "Faça login"}
              </button>
            </p>

            <!-- Error -->
            <p id="auth-error" class="mt-4 text-red-500 text-sm text-center hidden"></p>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Hook pós-renderização — ativa validação em tempo real
   */
  afterRender() {
    const errorEl = document.getElementById("auth-error");
    if (errorEl) errorEl.classList.add("hidden");

    // Ativa o botão de submit após validação dos campos obrigatórios
    this._enableSubmitOnValid();
  },

  /**
   * Habilita o botão apenas quando todos os campos obrigatórios estiverem preenchidos
   */
  _enableSubmitOnValid() {
    const form = document.getElementById("auth-form");
    const submitBtn = document.getElementById("auth-submit");

    const check = () => {
      const email = document.getElementById("auth-email")?.value?.trim();
      const password = document.getElementById("auth-password")?.value?.trim();
      const name = document.getElementById("auth-name")?.value?.trim();
      const valid = email && password && password.length >= 6 && (this._mode === "login" || name);
      submitBtn.disabled = !valid;
    };

    form?.addEventListener("input", check);
    check();
  },

  /**
   * Alterna entre login e registro
   */
  toggleMode() {
    this._mode = this._mode === "login" ? "register" : "login";
    Router.refresh();
  },

  /**
   * Processa o submit — chama a API real
   */
  async submit(event) {
    event.preventDefault();
    if (this._loading) return;

    const isLogin = this._mode === "login";
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value;

    // Validação
    if (!email || !password) {
      this.showError("Preencha todos os campos obrigatórios.");
      return;
    }

    if (password.length < 6) {
      this.showError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    const nameEl = document.getElementById("auth-name");
    if (!isLogin && !nameEl?.value?.trim()) {
      this.showError("Preencha seu nome completo.");
      return;
    }

    // Ativa loading
    this._setLoading(true);

    try {
      let response;

      if (isLogin) {
        // ── Login ──────────────────────────────────────
        const res = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || err.error || "Credenciais inválidas");
        }

        response = await res.json();
      } else {
        // ── Registro ────────────────────────────────────
        const name = nameEl.value.trim();
        const role = document.querySelector('input[name="auth-role"]:checked')?.value || "company";

        const res = await fetch(`${CONFIG.API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, role }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || err.error || "Erro ao cadastrar");
        }

        response = await res.json();
      }

      // Sucesso — salva token + dados do usuário
      Storage.setToken(response.token);
      Storage.setUser(response.user);

      Toast.success(isLogin ? "Login realizado com sucesso!" : "Conta criada com sucesso!");

      // Redireciona para o dashboard
      setTimeout(() => {
        App.initialize();
      }, 300);

    } catch (error) {
      this.showError(error.message);
    } finally {
      this._setLoading(false);
    }
  },

  /**
   * Controla estado de loading do formulário
   */
  _setLoading(loading) {
    this._loading = loading;
    const submitBtn = document.getElementById("auth-submit");
    const submitText = document.getElementById("auth-submit-text");
    const submitLoading = document.getElementById("auth-submit-loading");

    if (submitBtn) submitBtn.disabled = loading;
    if (submitText) submitText.classList.toggle("hidden", loading);
    if (submitLoading) submitLoading.classList.toggle("hidden", !loading);
  },

  /**
   * Exibe mensagem de erro
   */
  showError(message) {
    const errorEl = document.getElementById("auth-error");
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove("hidden");
      // Auto-esconde após 5s
      setTimeout(() => errorEl.classList.add("hidden"), 5000);
    }
  },
};
