/**
 * ── OpenCargo — Profile Page ──────────────────────────
 * Exibe informações do perfil do usuário:
 * avatar, nome, email, role, telefone, avaliações.
 * A edição do perfil abre um modal via SettingsPage.
 */

const ProfilePage = {
  /** Dados do usuário */
  _user: null,

  /** Dados de avaliação */
  _ratings: null,

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

    // Carrega avaliações
    await this._fetchRatings(user);

    const initials = Utils.getInitials(user.name);
    const avatarColor = Utils.getAvatarColor(user.name);

    return `
      <div class="fade-in max-w-3xl mx-auto space-y-6">
        <!-- Header -->
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">${__("page.profile")}</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">${__("page.profile.desc")}</p>
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
                    ${user.role === "administrador" ? Icons.star({ class: 'w-4 h-4 inline -mt-0.5' }) + ' Administrador' : user.role === "empresa" ? Icons.building({ class: 'w-4 h-4 inline -mt-0.5' }) + ' Empresa' : user.role === "motorista" ? Icons.truck({ class: 'w-4 h-4 inline -mt-0.5' }) + ' Motorista' : user.role === "gestor" ? Icons.shield({ class: 'w-4 h-4 inline -mt-0.5' }) + ' Gestor' : Utils.escapeHtml(user.role) || '—'}
                  </span>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-400/20 text-green-100">
                    ${user.phone ? Icons.phone({ class: 'w-4 h-4 inline -mt-0.5' }) + ' ' + user.phone : Icons.clock({ class: 'w-4 h-4 inline -mt-0.5' }) + ' Telefone não informado'}
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
              <p class="text-sm font-medium text-gray-900 dark:text-white mt-1 capitalize">${user.role === "company" ? "Empresa" : user.role === "driver" ? "Motorista" : user.role === "administrador" ? "Administrador" : user.role === "gestor" ? "Gestor" : user.role === "empresa" ? "Empresa" : user.role === "motorista" ? "Motorista" : Utils.escapeHtml(user.role) || "—"}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">Membro desde</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">${user.created_at ? Utils.formatDate(user.created_at, true) : "—"}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">ID do usuário</p>
              <p class="text-sm font-mono text-gray-900 dark:text-white mt-1 truncate" title="${user.id}">${user.id || "—"}</p>
            </div>
          </div>
        </div>

        <!-- Card: Rating Breakdown -->
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
        ` : `
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <p class="text-gray-400 text-sm">Nenhuma avaliação recebida ainda.</p>
        </div>
        `}

        <!-- Link para Configurações -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button onclick="Router.go('settings')"
            class="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 group-hover:scale-110 transition-transform">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <div class="text-left">
                <p class="text-sm font-medium text-gray-900 dark:text-white">Configurações</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Tema, idioma, senha e ações da conta</p>
              </div>
            </div>
            <svg class="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
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
   * Carrega dados do usuário
   */
  async _loadUser() {
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

    this._user = Storage.getUser();
    return this._user;
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
    }
  },
};
