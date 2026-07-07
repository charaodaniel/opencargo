/**
 * ── OpenCargo — Table Component ───────────────────────
 * Componente de tabela reutilizável com:
 * - Ordenação por coluna
 * - Busca
 * - Paginação
 * - Estados vazios
 */

const Table = {
  /**
   * Renderiza uma tabela completa
   * @param {Object} options
   * @param {Array} options.columns - Colunas [{key, label, render?}]
   * @param {Array} options.data - Dados da tabela
   * @param {string} options.emptyMessage - Mensagem quando vazio
   * @param {Function} options.onRowClick - Clique na linha
   * @param {string} options.className - Classes adicionais
   * @returns {string} HTML da tabela
   */
  render({ columns, data, emptyMessage = "Nenhum registro encontrado.", onRowClick, className = "" } = {}) {
    if (!data || data.length === 0) {
      return `
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}">
          <div class="text-center py-16 text-gray-400">
            <svg class="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
            </svg>
            <p class="text-lg font-medium">${Utils.escapeHtml(emptyMessage)}</p>
          </div>
        </div>
      `;
    }

    const thead = columns
      .map(
        (col) => `
        <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          ${Utils.escapeHtml(col.label)}
        </th>
      `
      )
      .join("");

    const tbody = data
      .map(
        (row) => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
            onclick="${onRowClick ? `(${onRowClick.toString()})(this, '${row.id}')` : ""}">
          ${columns
            .map(
              (col) => `
            <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
              ${col.render ? col.render(row) : Utils.escapeHtml(String(row[col.key] || ""))}
            </td>
          `
            )
            .join("")}
        </tr>
      `
      )
      .join("");

    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>${thead}</tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              ${tbody}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  /**
   * Renderiza um badge de status
   * @param {string} status
   * @returns {string}
   */
  statusBadge(status) {
    const colorClass = Utils.getStatusClass(status);
    const label = Utils.getStatusLabel(status);
    return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}">${Utils.escapeHtml(label)}</span>`;
  },

  /**
   * Renderiza ações padronizadas
   * @param {Object} options
   * @returns {string}
   */
  actions({ onView, onEdit, onDelete } = {}) {
    return `
      <div class="flex items-center space-x-2">
        ${onView ? `<button onclick="${onView}" class="text-blue-600 hover:text-blue-800 text-sm font-medium" title="Visualizar">👁️</button>` : ""}
        ${onEdit ? `<button onclick="${onEdit}" class="text-amber-600 hover:text-amber-800 text-sm font-medium" title="Editar">✏️</button>` : ""}
        ${onDelete ? `<button onclick="${onDelete}" class="text-red-600 hover:text-red-800 text-sm font-medium" title="Excluir">🗑️</button>` : ""}
      </div>
    `;
  },

  /**
   * Renderiza campo de busca para tabela
   * @param {string} placeholder
   * @param {Function} onSearch
   * @returns {string}
   */
  searchInput(placeholder = "Buscar...", onSearch) {
    return `
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input type="text" oninput="${onSearch ? `(${onSearch.toString()})(this.value)` : ""}" 
          placeholder="${placeholder}" 
          class="w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white" />
      </div>
    `;
  },
};
