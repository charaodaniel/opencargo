/**
 * ── OpenCargo — Login Page ────────────────────────────
 * Página de autenticação com login e registro.
 */

const LoginPage = {
  /** Modo: 'login' ou 'register' */
  _mode: "login",

  /**
   * Renderiza a página de login/registro
   */
  render() {
    const isLogin = this._mode === "login";

    return `
      <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div class="w-full max-w-md fade-in">
          <!-- Logo -->
          <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">OpenCargo</h1>
            <p class="text-gray-500 dark:text-gray-400 mt-1">Logística Colaborativa</p>
          </div>

          <!-- Form -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h2 class="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
              ${isLogin ? "Entrar" : "Criar Conta"}
            </h2>

            <form id="auth-form" onsubmit="LoginPage.submit(event)" class="space-y-4">
              ${isLogin ? "" : `
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome completo</label>
                  <input type="text" id="auth-name" required
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" />
                </div>
              `}

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
                <input type="email" id="auth-email" required placeholder="seu@email.com"
                  class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
                <input type="password" id="auth-password" required minlength="6"
                  class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" />
              </div>

              ${isLogin ? "" : `
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de conta</label>
                  <select id="auth-role"
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white">
                    <option value="company">Empresa</option>
                    <option value="driver">Motorista</option>
                  </select>
                </div>
              `}

              <button type="submit" class="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                ${isLogin ? "Entrar" : "Criar Conta"}
              </button>
            </form>

            <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
              <span>${isLogin ? "Não tem conta?" : "Já tem conta?"}</span>
              <a href="#" onclick="LoginPage.toggleMode()" class="text-blue-600 hover:underline font-medium ml-1">
                ${isLogin ? "Cadastre-se" : "Faça login"}
              </a>
            </p>

            <p id="auth-error" class="mt-4 text-red-500 text-sm text-center hidden"></p>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Alterna entre login e registro
   */
  toggleMode() {
    this._mode = this._mode === "login" ? "register" : "login";
    Router.refresh();
  },

  /**
   * Processa o submit do formulário
   */
  submit(event) {
    event.preventDefault();
    const isLogin = this._mode === "login";
    const email = document.getElementById("auth-email").value;
    const password = document.getElementById("auth-password").value;

    // Validação básica
    if (!email || !password) {
      this.showError("Preencha todos os campos obrigatórios.");
      return;
    }

    if (password.length < 6) {
      this.showError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    // Mock: simula autenticação
    const mockUser = {
      id: 2,
      name: email.split("@")[0],
      email: email,
      role: isLogin ? "company" : document.getElementById("auth-role")?.value || "company",
    };

    Storage.setUser(mockUser);
    Storage.setToken("mock-jwt-token-" + Date.now());

    Toast.success(isLogin ? "Login realizado com sucesso!" : "Conta criada com sucesso!");

    // Redireciona para o dashboard
    setTimeout(() => {
      App.initialize();
    }, 500);
  },

  /**
   * Exibe mensagem de erro
   */
  showError(message) {
    const errorEl = document.getElementById("auth-error");
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove("hidden");
    }
  },

  /**
   * Hook executado pós-renderização
   */
  afterRender() {
    const errorEl = document.getElementById("auth-error");
    if (errorEl) errorEl.classList.add("hidden");
  },
};
