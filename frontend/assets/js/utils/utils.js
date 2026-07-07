/**
 * ── OpenCargo — Utilitários ───────────────────────────
 * Funções auxiliares reutilizáveis em toda a aplicação.
 */

const Utils = {
  /**
   * Formata data ISO para o formato brasileiro
   * @param {string} dateStr - Data em formato ISO
   * @param {boolean} showTime - Exibir horas?
   * @returns {string} Data formatada
   */
  formatDate(dateStr, showTime = false) {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      const options = {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      };
      if (showTime) {
        options.hour = "2-digit";
        options.minute = "2-digit";
      }
      return d.toLocaleDateString("pt-BR", options);
    } catch {
      return dateStr;
    }
  },

  /**
   * Formata valor numérico como moeda BRL
   * @param {number} value - Valor a ser formatado
   * @returns {string} Valor formatado (ex: R$ 1.500,00)
   */
  formatCurrency(value) {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  },

  /**
   * Formata número com separadores
   * @param {number} value
   * @returns {string}
   */
  formatNumber(value) {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat("pt-BR").format(value);
  },

  /**
   * Retorna a classe CSS para o badge de status
   * @param {string} status
   * @returns {string} Classes Tailwind
   */
  getStatusClass(status) {
    const colors = {
      active: "bg-green-100 text-green-800",
      available: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      matched: "bg-blue-100 text-blue-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      in_transit: "bg-indigo-100 text-indigo-800",
      delivered: "bg-emerald-100 text-emerald-800",
      cancelled: "bg-red-100 text-red-800",
      completed: "bg-gray-100 text-gray-800",
      maintenance: "bg-orange-100 text-orange-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  },

  /**
   * Retorna o label em português para o status
   * @param {string} status
   * @returns {string}
   */
  getStatusLabel(status) {
    const labels = {
      active: "Ativa",
      available: "Disponível",
      pending: "Pendente",
      matched: "Compatível",
      accepted: "Aceito",
      rejected: "Rejeitado",
      in_transit: "Em Trânsito",
      delivered: "Entregue",
      cancelled: "Cancelado",
      completed: "Concluída",
      maintenance: "Em Manutenção",
    };
    return labels[status] || status;
  },

  /**
   * Retorna iniciais para avatar
   * @param {string} name
   * @returns {string}
   */
  getInitials(name) {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  },

  /**
   * Gera uma cor baseada no nome (para avatares)
   * @param {string} name
   * @returns {string} Cor hexadecimal
   */
  getAvatarColor(name) {
    const colors = [
      "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
      "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
    ];
    let hash = 0;
    if (name) {
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
    }
    return colors[Math.abs(hash) % colors.length];
  },

  /**
   * Filtra dados por termo de busca
   * @param {Array} data - Array de objetos
   * @param {string} term - Termo de busca
   * @param {Array} fields - Campos a buscar
   * @returns {Array}
   */
  search(data, term, fields = ["name"]) {
    if (!term || !term.trim()) return data;
    const searchTerm = term.toLowerCase().trim();
    return data.filter((item) =>
      fields.some((field) => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(searchTerm);
      })
    );
  },

  /**
   * Ordena array por campo
   * @param {Array} data
   * @param {string} field
   * @param {string} order - 'asc' ou 'desc'
   * @returns {Array}
   */
  sortBy(data, field, order = "asc") {
    return [...data].sort((a, b) => {
      const aVal = a[field] || "";
      const bVal = b[field] || "";
      const compare = String(aVal).localeCompare(String(bVal));
      return order === "asc" ? compare : -compare;
    });
  },

  /**
   * Trunca texto com limite de caracteres
   * @param {string} text
   * @param {number} limit
   * @returns {string}
   */
  truncate(text, limit = 50) {
    if (!text || text.length <= limit) return text || "";
    return text.slice(0, limit) + "...";
  },

  /**
   * Gera ID único simples
   * @returns {string}
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  },

  /**
   * Debounce para evitar execuções frequentes
   * @param {Function} fn
   * @param {number} delay
   * @returns {Function}
   */
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  /**
   * Escapa HTML para evitar XSS
   * @param {string} html
   * @returns {string}
   */
  escapeHtml(html) {
    const div = document.createElement("div");
    div.textContent = html;
    return div.innerHTML;
  },
};
