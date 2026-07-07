/**
 * ── OpenCargo — Profile Page ──────────────────────────
 * Página de perfil do usuário logado com edição via API.
 * Exibe dados pessoais, preferências e ações da conta.
 */

const ProfilePage = {
  /** Dados do usuário carregados da API */
  _user: null,

  /** Loading state */
  _loading: false,

  /**
   * Renderiza a página de perfil
   */
  async render() {
    const user = await this._loadUser();
    if (!user) {
      return `
        <div class="text-center py-16">
          <p class="text-gray-500">Erro ao carregar perfil.</p>
          <button onclick="Router.refresh()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">Tentar novamente</button>
        </div>
      `;
    }

    const initials = Utils.getInitials(user.name);
    const avatarColor = Utils.getAvatarColor(user.name);

    return `
      <div class="fade-in max-w-3xl mx-auto space-y-6">
        <!-- Header -->
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Meu Perfil</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">Gerencie seus dados de acesso e preferências</p>
        </div>

        <!-- Card: Avatar + Info -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-10 text-white relative overflow-hidden">
            <div class="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
            <div class="absolute bottom-0 left-1/3 w-64 h-64 bg-white/5 rounded-full translate-y-1/2"></div>
            <div class="relative flex items-center gap-6">
              <div class="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg ring-4 ring-white/30" style="background-color: ${avatarColor}">
                ${initials}
              </div>
              <div class="flex-1 min-w-0">
                <h2 class="text-2xl font-bold truncate">${Utils.escapeHtml(user.name)}</h2>
                <p class="text-blue-100 text-sm mt-0.5">${Utils.escapeHtml(user.email)}</p>
                <div class="flex items-center gap-2 mt-2">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                    ${user.role === "admin" ? "👑 Administrador" : user.role === "company" ? "🏢 Empresa" : "🚚 Motorista"}
                  </span>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-400/20 text-green-100">
                    ${user.phone ? "📱 " + user.phone : "⏳ Telefone não informado"}
                  </span>
                </div>
              </div>
              <button onclick="ProfilePage._openEditModal()" class="shrink-0 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-all backdrop-blur-sm">
                <svg class="w-4 h-4 inline-block mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                Editar
              </button>
            </div>
          </div>

          <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p class="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">Nome completo</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">${Utils.escapeHtml(user.name)}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">E-mail</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">${Utils.escapeHtml(user.email)}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">Telefone</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">${user.phone ? Utils.escapeHtml(user.phone) : "<span class=\"text-gray-400\">Não informado</span>"}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">Tipo de conta</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white mt-1 capitalize">${user.role === "company" ? "Empresa" : user.role === "driver" ? "Motorista" : "Administrador"}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">Membro desde</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">${user.created_at ? Utils.formatDate(user.created_at, true) : "-"}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">Versão do sistema</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">${CONFIG.APP_VERSION}</p>
            </div>
          </div>
        </div>

        <!-- Card: Preferências -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preferências</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between py-2">
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">Tema escuro</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Alternar entre tema claro e escuro</p>
              </div>
              <button onclick="Navbar.toggleTheme(); ProfilePage._updateThemeToggle()" 
                class="relative w-12 h-6 rounded-full transition-colors duration-300 ${Storage.getTheme() === "dark" ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}" role="switch">
                <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${Storage.getTheme() === "dark" ? "translate-x-6" : ""}"></span>
              </button>
            </div>
          </div>
        </div>

        <!-- Card: Ações -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ações da Conta</h3>
          <div class="space-y-3">
            <button onclick="Modal.confirm('Tem certeza que deseja sair?', () => { Storage.logout(); location.reload(); }, 'Sair')" 
              class="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                </div>
                <div class="text-left">
                  <p class="text-sm font-medium text-red-600 dark:text-red-400">Sair da conta</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Desconectar e voltar para a página inicial</p>
                </div>
              </div>
              <svg class="w-5 h-5 text-red-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Hook pós-renderização
   */
  afterRender() {
    // Nada por enquanto
  },

  /**
   * Carrega dados do usuário (da API ou do storage local)
   */
  async _loadUser() {
    // Tenta da API primeiro
    try {
      const token = Storage.getToken();
      if (token && CONFIG.API_BASE_URL) {
        const res = await fetch(`${CONFIG.API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          this._user = await res.json();
          Storage.setUser(this._user);
          return this._user;
        }
      }
    } catch { /* fallback */ }

    // Fallback: storage local
    this._user = Storage.getUser();
    return this._user;
  },

  /**
   * Abre modal de edição do perfil
   */
  _openEditModal() {
    const user = this._user || Storage.getUser();
    if (!user) return;

    Modal.openForm({
      title: "Editar Perfil",
      submitText: "Salvar Alterações",
      fields: [
        {
          name: "name",
          label: "Nome completo",
          type: "text",
          value: user.name || "",
          required: true,
          placeholder: "Seu nome completo",
        },
        {
          name: "phone",
          label: "Telefone",
          type: "text",
          value: user.phone || "",
          placeholder: "(11) 99999-9999",
        },
      ],
      onSubmit: (data) => this._saveProfile(data),
    });
  },

  /**
   * Salva alterações do perfil via API
   */
  async _saveProfile(data) {
    if (this._loading) return;
    this._loading = true;

    try {
      const token = Storage.getToken();
      if (!token || !CONFIG.API_BASE_URL) {
        // Mock: salva localmente
        const user = Storage.getUser();
        if (user) {
          Object.assign(user, data);
          Storage.setUser(user);
          this._user = user;
        }
        Toast.success("Perfil atualizado!");
        Router.refresh();
        return;
      }

      const user = this._user || Storage.getUser();
      const res = await fetch(`${CONFIG.API_BASE_URL}/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Erro ao salvar");
      }

      const updated = await res.json();
      Storage.setUser(updated);
      this._user = updated;

      Modal.close();
      Toast.success("Perfil atualizado com sucesso!");
      Router.refresh();
    } catch (error) {
      Toast.error(error.message);
    } finally {
      this._loading = false;
    }
  },

  /**
   * Atualiza o toggle de tema sem recarregar a página
   */
  _updateThemeToggle() {
    const isDark = Storage.getTheme() === "dark";
    const toggle = document.querySelector('[onclick*="toggleTheme"]');
    if (toggle) {
      toggle.className = `relative w-12 h-6 rounded-full transition-colors duration-300 ${isDark ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`;
      const knob = toggle.querySelector("span");
      if (knob) knob.classList.toggle("translate-x-6", isDark);
    }
  },
};
