/**
 * ── OpenCargo — Card Component ────────────────────────
 * Componentes de cartão para exibição de estatísticas,
 * informações e conteúdos diversos.
 */

const Card = {
  /**
   * Renderiza um cartão de estatística (dashboard)
   * @param {Object} options
   * @param {string} options.title - Título
   * @param {string|number} options.value - Valor principal
   * @param {string} options.subtitle - Texto auxiliar
   * @param {string} options.icon - Ícone SVG
   * @param {string} options.color - Cor do ícone (classe Tailwind)
   * @param {string} options.href - Link (opcional)
   * @returns {string} HTML do cartão
   */
  stat({ title, value, subtitle, icon, color = "blue", href } = {}) {
    const colors = {
      blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
      green: "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400",
      purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400",
      amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400",
      red: "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400",
      indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400",
    };

    const card = `
      <div class="glass-card rounded-xl p-6 card-hover ${href ? "cursor-pointer" : ""}">
        <div class="flex items-center justify-between mb-3">
          <div class="w-10 h-10 ${colors[color] || colors.blue} rounded-lg flex items-center justify-center">
            ${icon || ""}
          </div>
        </div>
        <p class="text-3xl font-bold text-gray-900 dark:text-white">${value !== undefined && value !== null ? value : "-"}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">${Utils.escapeHtml(title)}</p>
        ${subtitle ? `<p class="text-xs text-gray-400 dark:text-gray-500 mt-2">${subtitle}</p>` : ""}
      </div>
    `;

    return href
      ? `<a href="${href}" class="block card-hover">${card}</a>`
      : `<div class="card-hover">${card}</div>`;
  },

  /**
   * Renderiza um cartão de informação (perfil/detalhes)
   * @param {Object} options
   * @returns {string}
   */
  info({ title, children, headerRight, className = "" } = {}) {
    return `
      <div class="glass-card rounded-xl overflow-hidden ${className}">
        ${title ? `
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${Utils.escapeHtml(title)}</h3>
            ${headerRight || ""}
          </div>
        ` : ""}
        <div class="p-6">
          ${children || ""}
        </div>
      </div>
    `;
  },

  /**
   * Renderiza um grid de informações (chave/valor)
   * @param {Array} items - [{label, value}]
   * @param {number} cols - Número de colunas
   * @returns {string}
   */
  infoGrid(items, cols = 2) {
    const colClass = {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    };

    return `
      <div class="grid ${colClass[cols] || colClass[2]} gap-6">
        ${items
          .map(
            (item) => `
          <div>
            <p class="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">${Utils.escapeHtml(item.label)}</p>
            <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">${item.value !== undefined && item.value !== null ? item.value : "-"}</p>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  },

  /**
   * Skeleton loading para cartões
   * @param {number} count - Número de skeletons
   * @returns {string}
   */
  skeleton(count = 4) {
    return Array(count)
      .fill(0)
      .map(
        () => `
      <div class="glass-card rounded-xl p-6 animate-pulse">
        <div class="flex items-center justify-between mb-3">
          <div class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
    `
      )
      .join("");
  },
};
