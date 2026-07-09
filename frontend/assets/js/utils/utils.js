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
   * Valida CPF (11 dígitos, dígitos verificadores)
   */
  validateCpf(cpf) {
    if (!cpf) return false;
    const nums = cpf.replace(/\D/g, "");
    if (nums.length !== 11 || /^(\d)\1{10}$/.test(nums)) return false;
    const calc = (digits, factors) =>
      digits.reduce((sum, d, i) => sum + d * factors[i], 0) % 11;
    const d1 = calc(nums.slice(0, 9).split("").map(Number), [10,9,8,7,6,5,4,3,2]);
    const d2 = calc(nums.slice(0, 10).split("").map(Number), [11,10,9,8,7,6,5,4,3,2]);
    return parseInt(nums[9]) === (d1 < 2 ? 0 : 11 - d1) &&
           parseInt(nums[10]) === (d2 < 2 ? 0 : 11 - d2);
  },

  /**
   * Valida CNPJ (14 dígitos, dígitos verificadores)
   */
  validateCnpj(cnpj) {
    if (!cnpj) return false;
    const nums = cnpj.replace(/\D/g, "");
    if (nums.length !== 14 || /^(\d)\1{13}$/.test(nums)) return false;
    const calc = (digits, factors) =>
      digits.reduce((sum, d, i) => sum + d * factors[i], 0) % 11;
    const d1 = calc(nums.slice(0, 12).split("").map(Number), [5,4,3,2,9,8,7,6,5,4,3,2]);
    const d2 = calc(nums.slice(0, 13).split("").map(Number), [6,5,4,3,2,9,8,7,6,5,4,3,2]);
    return parseInt(nums[12]) === (d1 < 2 ? 0 : 11 - d1) &&
           parseInt(nums[13]) === (d2 < 2 ? 0 : 11 - d2);
  },

  /**
   * Formata CPF: 000.000.000-00
   */
  formatCpf(cpf) {
    const nums = cpf.replace(/\D/g, "").slice(0, 11);
    return nums.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  },

  /**
   * Formata CNPJ: 00.000.000/0000-00
   */
  formatCnpj(cnpj) {
    const nums = cnpj.replace(/\D/g, "").slice(0, 14);
    return nums.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
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

  /**
   * Exporta dados como CSV e faz download
   * @param {Array<Object>} data - Dados a exportar
   * @param {Array<{key: string, label: string}>} columns - Colunas
   * @param {string} filename - Nome do arquivo
   */
  exportCsv(data, columns, filename = "export") {
    if (!data || data.length === 0) {
      Toast.warning("Nenhum dado para exportar.");
      return;
    }
    const header = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(",");
    const rows = data.map((row) =>
      columns.map((c) => {
        const val = this._getNestedValue(row, c.key);
        if (val === null || val === undefined) return "";
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(",")
    );
    const csv = "\uFEFF" + [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    Toast.success(`${filename}.csv exportado!`);
  },

  /**
   * Acessa valor aninhado (ex: "user.name")
   */
  _getNestedValue(obj, key) {
    if (!key || !obj) return obj;
    return key.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
  },

  /**
   * Renderiza um card de filtro clicável para as páginas CRUD.
   * Centraliza o HTML que era duplicado em 7 páginas.
   *
   * @param {Object} opts
   * @param {string} opts.value - Valor do filtro (ex: "all", "active", "")
   * @param {string} opts.label - Texto exibido (ex: "Todas", "Ativas")
   * @param {number} opts.count - Quantidade de itens
   * @param {boolean} opts.isActive - Se este filtro está ativo
   * @param {string} opts.pageNs - Namespace global da página (ex: "CompaniesPage")
   * @returns {string} HTML do card
   */
  renderFilterCard({ value, label, count, isActive, pageNs }) {
    return `
      <button onclick="${pageNs}.setFilterCard('${value}')"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
          ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600'
          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
        }">
        ${label}
        <span class="ml-1.5 text-xs ${isActive ? 'text-blue-200' : 'text-gray-400 dark:text-gray-500'}">(${count})</span>
      </button>
    `;
  },
};
