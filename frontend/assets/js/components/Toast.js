/**
 * ── OpenCargo — Toast Component ───────────────────────
 * Sistema de notificações toast para feedback ao usuário.
 * Suporta tipos: success, error, warning, info.
 */

const Toast = {
  /** Container onde os toasts são renderizados */
  container: null,

  /** IDs dos timeouts ativos */
  _timeouts: new Map(),

  /**
   * Inicializa o container de toasts
   */
  init() {
    if (this.container) return;
    this.container = document.createElement("div");
    this.container.id = "toast-container";
    this.container.className =
      "fixed bottom-6 right-6 z-50 flex flex-col space-y-3";
    document.body.appendChild(this.container);
  },

  /**
   * Exibe uma notificação toast
   * @param {string} message - Mensagem a ser exibida
   * @param {string} type - Tipo: 'success' | 'error' | 'warning' | 'info'
   * @param {number} duration - Tempo em ms (padrão: CONFIG.TOAST_DURATION)
   */
  show(message, type = "info", duration = CONFIG.TOAST_DURATION) {
    this.init();

    const icons = {
      success: `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
      error: `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
      warning: `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>`,
      info: `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    };

    const colors = {
      success: "bg-green-600",
      error: "bg-red-600",
      warning: "bg-yellow-500 text-gray-900",
      info: "bg-blue-600",
    };

    const id = Utils.generateId();
    const toast = document.createElement("div");
    toast.id = `toast-${id}`;
    toast.className = `flex items-center space-x-3 px-5 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${colors[type] || colors.info} transform translate-x-full opacity-0 transition-all duration-300`;
    toast.innerHTML = `
      ${icons[type] || icons.info}
      <span>${Utils.escapeHtml(message)}</span>
      <button class="ml-2 opacity-70 hover:opacity-100 transition-opacity" onclick="Toast.dismiss('${id}')">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    `;

    this.container.appendChild(toast);

    // Animação de entrada
    requestAnimationFrame(() => {
      toast.classList.remove("translate-x-full", "opacity-0");
    });

    // Auto-dismiss
    const timeout = setTimeout(() => this.dismiss(id), duration);
    this._timeouts.set(id, timeout);
  },

  /**
   * Remove um toast específico
   * @param {string} id - ID do toast
   */
  dismiss(id) {
    const toast = document.getElementById(`toast-${id}`);
    if (!toast) return;

    // Para o timeout se existir
    if (this._timeouts.has(id)) {
      clearTimeout(this._timeouts.get(id));
      this._timeouts.delete(id);
    }

    // Animação de saída
    toast.classList.add("translate-x-full", "opacity-0");
    setTimeout(() => toast.remove(), 300);
  },

  // Atalhos
  success(message) {
    this.show(message, "success");
  },
  error(message) {
    this.show(message, "error");
  },
  warning(message) {
    this.show(message, "warning");
  },
  info(message) {
    this.show(message, "info");
  },
};
