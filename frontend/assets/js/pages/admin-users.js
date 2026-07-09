/**
 * ── OpenCargo — Admin: Users Page ─────────────────────
 * Painel administrativo para gestão de usuários.
 * Apenas usuários com role "administrador" têm acesso.
 *
 * Funcionalidades:
 * - Lista todos os usuários com paginação
 * - Alterar role (administrador, gestor, empresa, motorista)
 * - Ativar/desativar usuário
 * - Excluir usuário
 */

const AdminUsersPage = {
  /** Dados atuais */
  _users: [],
  _page: 1,
  _totalPages: 1,

  /**
   * Renderiza a página
   */
  async render() {
    await this._loadUsers();

    return `
      <div class="fade-in">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              <svg class="w-6 h-6 inline-block mr-2 -mt-0.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/>
              </svg>
              ${__("admin.users.title")}
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">${__("admin.users.desc")}</p>
          </div>
          <div class="flex items-center space-x-3">
            <span class="text-sm text-gray-500 dark:text-gray-400">
              ${Utils.escapeHtml(String(this._users.length))} ${__("admin.users.total")}
            </span>
          </div>
        </div>

        ${this._renderStats()}
        ${this._renderTable()}
        ${this._renderPagination()}
      </div>
    `;
  },

  /**
   * Renderiza cards de estatísticas
   */
  _renderStats() {
    const admins = this._users.filter(u => u.role === "administrador").length;
    const gestores = this._users.filter(u => u.role === "gestor").length;
    const empresas = this._users.filter(u => u.role === "empresa").length;
    const motoristas = this._users.filter(u => u.role === "motorista").length;
    const ativos = this._users.filter(u => u.active).length;
    const inativos = this._users.filter(u => !u.active).length;

    const stats = [
      { label: __("role.admin"), value: admins, color: "bg-purple-500" },
      { label: __("role.manager"), value: gestores, color: "bg-blue-500" },
      { label: __("role.company"), value: empresas, color: "bg-green-500" },
      { label: __("role.driver"), value: motoristas, color: "bg-amber-500" },
      { label: "Ativos", value: ativos, color: "bg-emerald-500" },
      { label: "Inativos", value: inativos, color: "bg-red-500" },
    ];

    return `
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        ${stats.map(s => `
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
            <div class="text-2xl font-bold text-gray-900 dark:text-white">${s.value}</div>
            <div class="flex items-center justify-center space-x-1.5 mt-1">
              <span class="w-2 h-2 rounded-full ${s.color}"></span>
              <span class="text-xs text-gray-500 dark:text-gray-400">${Utils.escapeHtml(s.label)}</span>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  },

  /**
   * Renderiza a tabela de usuários
   */
  _renderTable() {
    if (!this._users || this._users.length === 0) {
      return `
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="text-center py-16 text-gray-400">
            <svg class="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/>
            </svg>
            <p class="text-lg font-medium">${__("admin.users.empty")}</p>
          </div>
        </div>
      `;
    }

    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">${__("label.name")}</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">${__("label.email")}</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">${__("label.role")}</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">${__("label.status")}</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">${__("label.createdAt")}</th>
                <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">${__("action.actions")}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              ${this._users.map(user => this._renderRow(user)).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  /**
   * Renderiza uma linha da tabela
   */
  _renderRow(user) {
    const roleLabels = {
      "administrador": __("role.admin"),
      "gestor": __("role.manager"),
      "empresa": __("role.company"),
      "motorista": __("role.driver"),
    };

    const roleColors = {
      "administrador": "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400",
      "gestor": "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400",
      "empresa": "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400",
      "motorista": "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400",
    };

    const createdDate = user.created_at
      ? new Date(user.created_at).toLocaleDateString(I18n.locale === "en" ? "en-US" : "pt-BR")
      : "-";

    return `
      <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
        <td class="px-6 py-4">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style="background-color: ${Utils.getAvatarColor(user.name)}">
              ${Utils.getInitials(user.name)}
            </div>
            <span class="font-medium text-gray-900 dark:text-white">${Utils.escapeHtml(user.name)}</span>
          </div>
        </td>
        <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">${Utils.escapeHtml(user.email)}</td>
        <td class="px-6 py-4">
          <select onchange="AdminUsersPage.changeRole('${user.id}', this.value)"
            class="text-xs font-medium rounded-full px-2.5 py-1 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${roleColors[user.role] || 'bg-gray-100 text-gray-800'}">
            ${Object.entries(roleLabels).map(([value, label]) => `
              <option value="${value}" ${user.role === value ? 'selected' : ''}>${Utils.escapeHtml(label)}</option>
            `).join("")}
          </select>
        </td>
        <td class="px-6 py-4">
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" ${user.active ? 'checked' : ''}
              onchange="AdminUsersPage.toggleActive('${user.id}', this.checked)"
              class="sr-only peer">
            <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            <span class="ml-2 text-xs ${user.active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
              ${user.active ? __("label.active") : __("label.inactive")}
            </span>
          </label>
        </td>
        <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">${createdDate}</td>
        <td class="px-6 py-4 text-right">
          <button onclick="AdminUsersPage.viewUser('${user.id}')"
            class="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Ver detalhes">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </button>
          <button onclick="AdminUsersPage.confirmDelete('${user.id}', '${Utils.escapeHtml(user.name)}')"
            class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="${__("action.delete")}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </td>
      </tr>
    `;
  },

  /**
   * Renderiza paginação
   */
  _renderPagination() {
    if (this._totalPages <= 1) return "";

    return `
      <div class="flex items-center justify-between mt-4">
        <button onclick="AdminUsersPage.goToPage(${this._page - 1})"
          ${this._page <= 1 ? 'disabled' : ''}
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          ${__("action.back")}
        </button>
        <span class="text-sm text-gray-600 dark:text-gray-400">
          ${__("label.page")} ${this._page} ${__("label.of")} ${this._totalPages}
        </span>
        <button onclick="AdminUsersPage.goToPage(${this._page + 1})"
          ${this._page >= this._totalPages ? 'disabled' : ''}
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          ${__("action.next")}
        </button>
      </div>
    `;
  },

  /**
   * Carrega usuários da API
   */
  async _loadUsers(page = 1) {
    try {
      const token = Storage.getToken();
      const res = await fetch(`${CONFIG.API_BASE_URL}/users/admin/all?page=${page}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 403) {
          this._users = [];
          this._totalPages = 1;
          return;
        }
        throw new Error(`Erro: ${res.status}`);
      }

      const json = await res.json();
      this._users = json.data || [];
      this._page = json.page || 1;
      this._totalPages = json.totalPages || 1;
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
      this._users = [];
      this._totalPages = 1;
    }
  },

  /**
   * Navega para uma página
   */
  async goToPage(page) {
    if (page < 1 || page > this._totalPages) return;
    await this._loadUsers(page);
    Router.refresh();
  },

  /**
   * Altera a role de um usuário
   */
  async changeRole(userId, newRole) {
    try {
      const token = Storage.getToken();
      const res = await fetch(`${CONFIG.API_BASE_URL}/users/${userId}/admin`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) throw new Error(`Erro: ${res.status}`);
      Toast.success(__("admin.users.roleUpdated"));
    } catch (err) {
      console.error("Erro ao alterar role:", err);
      Toast.error(__("message.error"));
      Router.refresh();
    }
  },

  /**
   * Ativa/desativa um usuário
   */
  async toggleActive(userId, active) {
    try {
      const token = Storage.getToken();
      const res = await fetch(`${CONFIG.API_BASE_URL}/users/${userId}/admin`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ active: active ? 1 : 0 }),
      });

      if (!res.ok) throw new Error(`Erro: ${res.status}`);
      Toast.success(active ? __("admin.users.activated") : __("admin.users.deactivated"));
    } catch (err) {
      console.error("Erro ao alterar status:", err);
      Toast.error(__("message.error"));
      Router.refresh();
    }
  },

  /**
   * Confirma exclusão de usuário
   */
  confirmDelete(userId, userName) {
    if (!confirm(`${__("message.confirmDelete")} "${userName}"?`)) return;

    this._deleteUser(userId);
  },

  /**
   * Abre modal com detalhes do usuário
   */
  async viewUser(userId) {
    try {
      const token = Storage.getToken();
      const res = await fetch(`${CONFIG.API_BASE_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Erro: ${res.status}`);

      const user = await res.json();
      const initials = Utils.getInitials(user.name);
      const avatarColor = Utils.getAvatarColor(user.name);

      const roleLabels = {
        "administrador": __("role.admin"),
        "gestor": __("role.manager"),
        "empresa": __("role.company"),
        "motorista": __("role.driver"),
      };

      const createdDate = user.created_at
        ? new Date(user.created_at).toLocaleDateString(I18n.locale === "en" ? "en-US" : "pt-BR")
        : "-";

      const updatedDate = user.updated_at
        ? new Date(user.updated_at).toLocaleDateString(I18n.locale === "en" ? "en-US" : "pt-BR")
        : "-";

      Modal.open({
        title: `
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style="background-color: ${avatarColor}">
              ${initials}
            </div>
            <div>
              <p class="text-lg font-semibold text-gray-900 dark:text-white">${Utils.escapeHtml(user.name)}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">${Utils.escapeHtml(user.email)}</p>
            </div>
          </div>
        `,
        body: `
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">${__("label.name")}</p>
                <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">${Utils.escapeHtml(user.name)}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">${__("label.email")}</p>
                <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">${Utils.escapeHtml(user.email)}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">${__("label.type")}</p>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.role === "administrador" ? "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400" :
                  user.role === "gestor" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400" :
                  user.role === "empresa" ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400" :
                  "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400"
                }">${roleLabels[user.role] || user.role}</span>
              </div>
              <div>
                <p class="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">${__("label.status")}</p>
                <span class="inline-flex items-center space-x-1.5 mt-1">
                  <span class="w-2 h-2 rounded-full ${user.active ? "bg-green-500" : "bg-red-500"}"></span>
                  <span class="text-sm font-medium ${user.active ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}">
                    ${user.active ? __("label.active") : __("label.inactive")}
                  </span>
                </span>
              </div>
              <div>
                <p class="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">${__("label.phone")}</p>
                <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">${user.phone ? Utils.escapeHtml(user.phone) : '<span class="text-gray-400">—</span>'}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">ID</p>
                <p class="text-sm font-mono text-gray-900 dark:text-white mt-1 truncate max-w-[180px]" title="${user.id}">${user.id}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">${__("label.createdAt")}</p>
                <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">${createdDate}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">${__("label.updatedAt") || "Atualizado em"}</p>
                <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">${updatedDate}</p>
              </div>
            </div>
          </div>
        `,
        footer: `
          <button onclick="Modal.close()"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            ${__("action.close")}
          </button>
        `,
      });
    } catch (err) {
      console.error("Erro ao carregar detalhes do usuário:", err);
      Toast.error(__("message.error"));
    }
  },

  /**
   * Exclui um usuário
   */
  async _deleteUser(userId) {
    try {
      const token = Storage.getToken();
      const res = await fetch(`${CONFIG.API_BASE_URL}/users/${userId}/admin`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok && res.status !== 204) throw new Error(`Erro: ${res.status}`);

      Toast.success(__("message.deleted"));
      Router.refresh();
    } catch (err) {
      console.error("Erro ao excluir usuário:", err);
      Toast.error(__("message.error"));
    }
  },
};
