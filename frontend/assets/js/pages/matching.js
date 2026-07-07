/**
 * ── OpenCargo — Matching Page ─────────────────────────
 * Motor de matching entre cargas e rotas.
 * Demonstração visual do algoritmo de compatibilidade.
 */

const MatchingPage = {
  async render() {
    const [matches, loads, routes, drivers] = await Promise.all([
      Api.get("matches"),
      Api.get("loads"),
      Api.get("routes"),
      Api.get("drivers"),
    ]);

    return `
      <div class="fade-in">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Matching</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">Encontre cargas e motoristas compatíveis</p>
        </div>

        <!-- Como funciona -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔍 Como funciona o Matching</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="text-center p-4">
              <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                <span class="text-xl">📦</span>
              </div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">1. Carga é cadastrada</p>
              <p class="text-xs text-gray-500 mt-1">Empresa informa origem, destino e peso</p>
            </div>
            <div class="text-center p-4">
              <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                <span class="text-xl">⚡</span>
              </div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">2. Sistema analisa</p>
              <p class="text-xs text-gray-500 mt-1">Compara rotas disponíveis</p>
            </div>
            <div class="text-center p-4">
              <div class="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                <span class="text-xl">🔗</span>
              </div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">3. Match encontrado</p>
              <p class="text-xs text-gray-500 mt-1">Motorista e carga compatíveis</p>
            </div>
            <div class="text-center p-4">
              <div class="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                <span class="text-xl">💬</span>
              </div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">4. Conexão realizada</p>
              <p class="text-xs text-gray-500 mt-1">Chat entre as partes</p>
            </div>
          </div>
        </div>

        <!-- Matches Ativos -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">📋 Matches Realizados</h3>
          ${matches.length === 0
            ? `<div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-400">
                <p class="text-lg font-medium">Nenhum match realizado</p>
                <p class="text-sm">Cadastre cargas e rotas para encontrar combinações</p>
              </div>`
            : matches
                .map(
                  (m) => `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-3 hover:border-blue-300 dark:hover:border-blue-600 transition-all">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style="background-color: ${Utils.getAvatarColor(m.driver_name)}">
                      ${Utils.getInitials(m.driver_name)}
                    </div>
                    <div>
                      <p class="font-medium text-gray-900 dark:text-white">${Utils.escapeHtml(m.load_title)}</p>
                      <p class="text-sm text-gray-500">${Utils.escapeHtml(m.driver_name)} • ${m.route_origin} → ${m.route_destination}</p>
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${Utils.getStatusClass(m.status)}">
                    ${Utils.getStatusLabel(m.status)}
                  </span>
                  <p class="text-xs text-gray-400 mt-1">Score: ${m.score}%</p>
                </div>
              </div>
            </div>
          `
                )
                .join("")}
        </div>

        <!-- Cargas vs Motoristas -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">📦 Cargas Disponíveis</h3>
            ${loads
              .filter((l) => l.status === "available")
              .slice(0, 5)
              .map(
                (l) => `
              <div class="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">${Utils.escapeHtml(l.title)}</p>
                  <p class="text-xs text-gray-500">${l.origin_city} → ${l.destination_city} • ${Utils.formatNumber(l.weight_kg)}kg</p>
                </div>
                <span class="text-xs text-green-600 font-medium">Disponível</span>
              </div>
            `
              )
              .join("")}
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">🛣️ Rotas de Retorno</h3>
            ${routes
              .filter((r) => r.is_return && r.status === "active")
              .slice(0, 5)
              .map(
                (r) => `
              <div class="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">${r.origin_city} → ${r.destination_city}</p>
                  <p class="text-xs text-gray-500">${Utils.escapeHtml(r.driver_name)} • ${Utils.formatDate(r.departure_date)}</p>
                </div>
                <span class="text-xs text-green-600 font-medium">${r.available_weight ? Utils.formatNumber(r.available_weight) + "kg" : ""}</span>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  },
};
