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
   * Renderiza o botão padrão de exportar CSV usado nas páginas CRUD.
   * Centraliza o HTML que era duplicado em 8 páginas.
   *
   * @param {string} pageNs - Namespace global da página (ex: "DriversPage")
   * @returns {string} HTML do botão
   */
  renderExportCsvButton(pageNs) {
    return `
      <button onclick="Utils.handleExport('${pageNs}')" class="flex items-center space-x-1.5 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" title="${__("action.exportCsv")}">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        <span class="hidden sm:inline">${__("action.exportCsv")}</span>
      </button>
    `;
  },

  /**
   * Dispara exportação CSV da página usando sua configuração _exportConfig.
   * Lê do escopo global a página e chama Utils.exportCsv() com os parâmetros
   * configurados (data, columns, filename).
   *
   * @param {string} pageNs - Namespace global da página (ex: "DriversPage")
   */
  handleExport(pageNs) {
    const page = window[pageNs];
    if (!page || !page._exportConfig) {
      console.warn(`Export config not found for ${pageNs}`);
      Toast.warning("Configuração de exportação não encontrada.");
      return;
    }
    const { data, columns, filename } = page._exportConfig;
    this.exportCsv(data, columns, filename);
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

  /**
   * Calcula as datas de início e fim para períodos predefinidos.
   * @param {'today'|'week'|'month'} period - Período desejado
   * @returns {{ dateFrom: string, dateTo: string }} Datas no formato YYYY-MM-DD
   */
  getPeriodDates(period) {
    const today = new Date();
    const yyyyMMdd = (d) => d.toISOString().split("T")[0];

    switch (period) {
      case "today":
        return { dateFrom: yyyyMMdd(today), dateTo: yyyyMMdd(today) };

      case "week": {
        const start = new Date(today);
        // Segunda-feira da semana atual
        const day = start.getDay(); // 0=domingo, 1=segunda, ..., 6=sabado
        const diff = day === 0 ? -6 : 1 - day;
        start.setDate(start.getDate() + diff);
        return { dateFrom: yyyyMMdd(start), dateTo: yyyyMMdd(today) };
      }

      case "month": {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        return { dateFrom: yyyyMMdd(start), dateTo: yyyyMMdd(today) };
      }

      default:
        return { dateFrom: "", dateTo: "" };
    }
  },

  /**
   * Renderiza os botões de período pré-definido (Hoje, Esta Semana, Este Mês).
   * Usado em páginas com filtros de data (freights, logs, matching).
   *
   * @param {Object} opts
   * @param {string} opts.dateFrom - Valor atual de dateFrom
   * @param {string} opts.dateTo - Valor atual de dateTo
   * @param {string} opts.pageNs - Namespace da página (ex: "FreightsPage")
   * @returns {string} HTML dos botões
   */
  renderPeriodFilter({ dateFrom, dateTo, pageNs }) {
    const periods = [
      { key: "today", label: "Hoje" },
      { key: "week", label: "Esta Semana" },
      { key: "month", label: "Este Mês" },
    ];

    return `
      <div class="flex flex-wrap gap-2 mb-3">
        ${periods.map(({ key, label }) => {
          const { dateFrom: df, dateTo: dt } = this.getPeriodDates(key);
          const isActive = dateFrom === df && dateTo === dt;
          return `
            <button onclick="${pageNs}.setPeriod('${key}')"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${isActive
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 ring-1 ring-blue-300 dark:ring-blue-600'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }">
              ${label}
            </button>
          `;
        }).join("")}
      </div>
    `;
  },
};
