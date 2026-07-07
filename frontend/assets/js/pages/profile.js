/**
 * ── OpenCargo — Profile Page ──────────────────────────
 * Página de perfil do usuário logado.
 */

const ProfilePage = {
  async render() {
    const user = Storage.getUser() || { name: "Usuário", email: "", role: "company" };

    return `
      <div class="fade-in max-w-2xl mx-auto">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Meu Perfil</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">Seus dados de acesso e preferências</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
            <div class="flex items-center space-x-4">
              <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <span class="text-2xl font-bold">${Utils.getInitials(user.name)}</span>
              </div>
              <div>
                <h3 class="text-xl font-bold">${Utils.escapeHtml(user.name)}</h3>
                <p class="text-blue-100 text-sm">${user.email}</p>
              </div>
            </div>
          </div>

          <div class="p-6 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p class="text-xs text-gray-400 uppercase tracking-wider">Nome</p>
                <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">${Utils.escapeHtml(user.name)}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400 uppercase tracking-wider">E-mail</p>
                <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">${Utils.escapeHtml(user.email)}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400 uppercase tracking-wider">Tipo</p>
                <p class="text-sm font-medium text-gray-900 dark:text-white mt-1 capitalize">${user.role === "company" ? "Empresa" : user.role === "driver" ? "Motorista" : "Administrador"}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400 uppercase tracking-wider">Versão do Sistema</p>
                <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">${CONFIG.APP_VERSION}</p>
              </div>
            </div>

            <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Preferências</h4>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">Tema Escuro</p>
                  <p class="text-xs text-gray-500">Alternar entre tema claro e escuro</p>
                </div>
                <button onclick="Navbar.toggleTheme()" class="relative w-11 h-6 rounded-full transition-colors ${Storage.getTheme() === "dark" ? "bg-blue-600" : "bg-gray-300"}">
                  <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${Storage.getTheme() === "dark" ? "translate-x-5" : ""}"></span>
                </button>
              </div>
            </div>

            <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
              <button onclick="Storage.logout(); location.reload();" class="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium">
                Sair da Conta
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },
};
