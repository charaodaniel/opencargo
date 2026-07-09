/**
 * ── OpenCargo — Settings Page (consolidated with Profile) ──
 * Página de configurações + perfil do usuário.
 * Inclui dados pessoais, preferências e ações da conta.
 */

const SettingsPage = {
  /** Dados do usuário carregados da API */
  _user: null,

  /** Loading state */
  _loading: false,

  /** Dados de avaliação do usuário */
  _ratings: null,

  /**
   * Renderiza a página de configurações + perfil
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

    // Carrega avaliações do usuário
    await this._fetchRatings(user);

    const initials = Utils.getInitials(user.name);
    const avatarColor = Utils.getAvatarColor(user.name);

    return `
      <div class="fade-in max-w-3xl mx-auto space-y-6">
        <!-- Header -->
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">${__("page.settings")}</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">${__("page.settings.desc")}</p>
        </div>

        <!-- Card: Avatar + Info (Profile) -->
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
                    ${user.role === "administrador" ? Icons.star({ class: 'w-4 h-4 inline -mt-0.5' }) + ' Administrador' : user.role === "empresa" ? Icons.building({ class: 'w-4 h-4 inline -mt-0.5' }) + ' Empresa' : user.role === "motorista" ? Icons.truck({ class: 'w-4 h-4 inline -mt-0.5' }) + ' Motorista' : user.role === "gestor" ? Icons.shield({ class: 'w-4 h-4 inline -mt-0.5' }) + ' Gestor' : Utils.escapeHtml(user.role) || '—'}
                  </span>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-400/20 text-green-100">
                    ${user.phone ? Icons.phone({ class: 'w-4 h-4 inline -mt-0.5' }) + ' ' + user.phone : Icons.clock({ class: 'w-4 h-4 inline -mt-0.5' }) + ' Telefone não informado'}
                  </span>
                </div>
              </div>
              <button onclick="SettingsPage._openEditModal()" class="shrink-0 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-all backdrop-blur-sm">
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

        <!-- Card: Rating Breakdown (se houver avaliações) -->
        ${this._ratings && this._ratings.total_reviews > 0 ? `
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${__("review.ratingOnProfile")}</h3>
            <button onclick="Router.go('reviews')" class="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              ${__("page.reviews")} →
            </button>
          </div>
          <div class="flex flex-col sm:flex-row items-center gap-4">
            <div class="text-center shrink-0">
              <div class="text-3xl font-bold text-gray-900 dark:text-white">${this._ratings.average_score.toFixed(1)}</div>
              <div class="text-yellow-500 text-sm mt-0.5">${Utils.renderStars ? Utils.renderStars(this._ratings.average_score) : "★".repeat(Math.round(this._ratings.average_score))}</div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">${this._ratings.total_reviews} ${this._ratings.total_reviews === 1 ? __("review.review") : __("review.reviews")}</p>
            </div>
            <div class="flex-1 w-full space-y-1">
              ${[5, 4, 3, 2, 1].map((star) => {
                const key = star === 5 ? "five" : star === 4 ? "four" : star === 3 ? "three" : star === 2 ? "two" : "one";
                const count = this._ratings[`${key}_stars`] || 0;
                const pct = this._ratings.total_reviews > 0 ? (count / this._ratings.total_reviews) * 100 : 0;
                return `
                  <div class="flex items-center space-x-2 text-xs">
                    <span class="w-6 text-right text-gray-500 dark:text-gray-400">${star}★</span>
                    <div class="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div class="h-full bg-yellow-400 rounded-full" style="width: ${pct}%"></div>
                    </div>
                    <span class="w-8 text-right text-gray-400 dark:text-gray-500">${count}</span>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        </div>
        ` : ""}

        <!-- Card: Tema -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div class="flex items-center space-x-2">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
              </svg>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${__("theme.toggle")}</h3>
            </div>
          </div>
          <div class="p-6 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">${__("theme.toggle")}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Alternar entre tema claro e escuro</p>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-xs text-gray-400 ${Storage.getTheme() === "light" ? "font-medium text-gray-700 dark:text-gray-200" : ""}">${__("theme.light")}</span>
                <button data-toggle-theme onclick="SettingsPage.toggleTheme()" 
                  class="relative w-14 h-7 rounded-full transition-colors duration-300 ${Storage.getTheme() === "dark" ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}" role="switch">
                  <span class="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-300 flex items-center justify-center ${Storage.getTheme() === "dark" ? "translate-x-7" : ""}">
                    <svg class="w-3.5 h-3.5 text-yellow-500 ${Storage.getTheme() === "dark" ? "hidden" : "block"}" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/>
                    </svg>
                    <svg class="w-3.5 h-3.5 text-blue-400 ${Storage.getTheme() === "dark" ? "block" : "hidden"}" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
                    </svg>
                  </span>
                </button>
                <span class="text-xs text-gray-400 ${Storage.getTheme() === "dark" ? "font-medium text-gray-700 dark:text-gray-200" : ""}">${__("theme.dark")}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Card: Idioma -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div class="flex items-center space-x-2">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${__("lang.switch")}</h3>
            </div>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-2 gap-3">
              <button onclick="SettingsPage.setLang('pt-BR')"
                class="flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 transition-all ${
                  I18n.locale === "pt-BR"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                    : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
                }">
                <span class="text-xl">🇧🇷</span>
                <span class="text-sm font-medium">${__("lang.ptBr")}</span>
              </button>
              <button onclick="SettingsPage.setLang('en')"
                class="flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 transition-all ${
                  I18n.locale === "en"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                    : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
                }">
                <span class="text-xl">🇺🇸</span>
                <span class="text-sm font-medium">${__("lang.en")}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Card: Alterar Senha -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div class="flex items-center space-x-2">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Alterar Senha</h3>
            </div>
          </div>
          <div class="p-6">
            <form id="password-form" onsubmit="SettingsPage.changePassword(event)" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha atual</label>
                <input type="password" id="pw-current" required
                  class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nova senha</label>
                <input type="password" id="pw-new" required minlength="8"
                  class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <p class="text-xs text-gray-400 mt-1">Mín. 8 caracteres, 1 maiúscula, 1 número e 1 caractere especial</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar nova senha</label>
                <input type="password" id="pw-confirm" required
                  class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <p id="pw-error" class="text-red-500 text-xs hidden"></p>
              <button type="submit" id="pw-submit"
                class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <span id="pw-submit-text">Alterar Senha</span>
                <span id="pw-submit-loading" class="hidden">
                  <svg class="animate-spin inline-block w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Alterando...
                </span>
              </button>
            </form>
          </div>
        </div>

        <!-- Card: Logout -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="p-6">
            <button onclick="SettingsPage.logout()"
              class="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                </div>
                <div class="text-left">
                  <p class="text-sm font-medium text-red-600 dark:text-red-400">${__("action.logout")}</p>
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
   * Busca avaliações do usuário
   */
  async _fetchRatings(user) {
    try {
      if (CONFIG.API_BASE_URL && Storage.getToken()) {
        const res = await fetch(`${CONFIG.API_BASE_URL}/reviews/stats/${user.id}`, {
          headers: { Authorization: `Bearer ${Storage.getToken()}` },
        });
        if (res.ok) {
          this._ratings = await res.json();
          return;
        }
      }
    } catch { /* fallback */ }
    this._ratings = null;
  },

  /**
   * Alterna tema claro/escuro
   */
  async toggleTheme() {
    Navbar.toggleTheme();
    // Re-renderiza para mostrar estado correto do toggle
    Router.refresh();
  },

  /**
   * Altera o idioma
   */
  setLang(locale) {
    Navbar.setLang(locale);
  },

  /**
   * Altera a senha do usuário via API
   */
  async changePassword(event) {
    event.preventDefault();

    const currentPassword = document.getElementById("pw-current")?.value;
    const newPassword = document.getElementById("pw-new")?.value;
    const confirmPassword = document.getElementById("pw-confirm")?.value;
    const errorEl = document.getElementById("pw-error");

    if (!currentPassword || !newPassword || !confirmPassword) return;

    // Validação client-side
    if (newPassword !== confirmPassword) {
      if (errorEl) {
        errorEl.textContent = "As senhas não conferem.";
        errorEl.classList.remove("hidden");
      }
      return;
    }

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      if (errorEl) {
        errorEl.textContent = "A senha deve ter 8+ caracteres, 1 maiúscula, 1 número e 1 caractere especial.";
        errorEl.classList.remove("hidden");
      }
      return;
    }

    errorEl?.classList.add("hidden");

    // Ativa loading
    const submitBtn = document.getElementById("pw-submit");
    const submitText = document.getElementById("pw-submit-text");
    const submitLoading = document.getElementById("pw-submit-loading");
    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.classList.add("hidden");
    if (submitLoading) submitLoading.classList.remove("hidden");

    try {
      const token = Storage.getToken();
      if (!token || !CONFIG.API_BASE_URL) {
        throw new Error("Conecte-se ao backend para alterar a senha.");
      }

      const res = await fetch(`${CONFIG.API_BASE_URL}/auth/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao alterar senha");
      }

      // Atualiza o token no storage (novo token gerado pelo backend)
      if (data.token) {
        Storage.setToken(data.token);
      }

      // Limpa formulário
      document.getElementById("pw-current").value = "";
      document.getElementById("pw-new").value = "";
      document.getElementById("pw-confirm").value = "";

      Toast.success("Senha alterada com sucesso!");
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err.message;
        errorEl.classList.remove("hidden");
      }
      Toast.error(err.message);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitText) submitText.classList.remove("hidden");
      if (submitLoading) submitLoading.classList.add("hidden");
    }
  },

  /**
   * Faz logout
   */
  logout() {
    Modal.confirm(
      __("message.confirmLogout"),
      () => {
        Storage.logout();
        window.location.reload();
      },
      __("action.logout")
    );
  },
};
