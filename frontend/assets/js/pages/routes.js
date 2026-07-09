/**
 * ── OpenCargo — Routes Page ───────────────────────────
 * Gerenciamento de rotas de viagem.
 */

const RoutesPage = {
  async render() {
    const [routes, drivers] = await Promise.all([
      Api.get("routes"),
      Api.get("drivers"),
    ]);
    this._routes = routes;

    const activeRoutes = routes.filter((r) => r.status === "active").length;
    const returnRoutes = routes.filter((r) => r.is_return).length;

    return `
      <div class="fade-in">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Rotas</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Gerencie as rotas de viagem</p>
          </div>
          <div class="flex items-center space-x-2">
            <button onclick="RoutesPage.exportCsv()" class="flex items-center space-x-1.5 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" title="${__("action.exportCsv")}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <span class="hidden sm:inline">${__("action.exportCsv")}</span>
            </button>
            <button onclick="RoutesPage.openForm()" class="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              <span class="hidden sm:inline">Nova Rota</span>
            </button>
          </div>
        </div>

        <!-- Mini stats -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <p class="text-2xl font-bold text-gray-900 dark:text-white">${activeRoutes}</p>
            <p class="text-sm text-gray-500">Rotas Ativas</p>
          </div>
          <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <p class="text-2xl font-bold text-gray-900 dark:text-white">${returnRoutes}</p>
            <p class="text-sm text-gray-500">Rotas de Retorno</p>
          </div>
        </div>

        ${Table.render({
          columns: [
            { label: "Origem", render: (r) => `${r.origin_city}/${r.origin_state}` },
            { label: "Destino", render: (r) => `${r.destination_city}/${r.destination_state}` },
            { label: "Partida", render: (r) => Utils.formatDate(r.departure_date) },
            { label: "Chegada", render: (r) => Utils.formatDate(r.arrival_date) },
            { label: "Motorista", key: "driver_name" },
            { label: "Capacidade", render: (r) => r.available_weight ? `${Utils.formatNumber(r.available_weight)} kg` : "-" },
            {
              label: "Retorno",
              render: (r) => r.is_return
                ? '<span class="text-green-600 dark:text-green-400 font-medium flex items-center space-x-1">' + Icons.check({ class: 'w-4 h-4' }) + '<span>Sim</span></span>'
                : '<span class="text-gray-400">Não</span>',
            },
            {
              label: "Status",
              render: (r) => Table.statusBadge(r.status),
            },
          ],
          data: routes,
          emptyMessage: "Nenhuma rota cadastrada.",
        })}
      </div>
    `;
  },

  /**
   * Exporta rotas como CSV
   */
  exportCsv() {
    Utils.exportCsv(
      this._routes,
      [
        { key: "origin_city", label: "Origem" },
        { key: "origin_state", label: "UF Origem" },
        { key: "destination_city", label: "Destino" },
        { key: "destination_state", label: "UF Destino" },
        { key: "departure_date", label: "Partida" },
        { key: "arrival_date", label: "Chegada" },
        { key: "driver_name", label: "Motorista" },
        { key: "available_weight", label: "Peso (kg)" },
        { key: "available_volume", label: "Volume (m³)" },
        { key: "is_return", label: "Retorno" },
        { key: "status", label: "Status" },
      ],
      "rotas"
    );
  },

  openForm(routeId = null) {
    Modal.openForm({
      title: routeId ? "Editar Rota" : "Nova Rota",
      submitText: routeId ? "Atualizar" : "Criar Rota",
      fields: [
        { name: "origin_city", label: "Cidade de Origem", type: "text", required: true, autocomplete: "city", placeholder: "Ex: São Paulo" },
        { name: "origin_state", label: "UF Origem", type: "text", maxlength: 2, required: true, placeholder: "SP" },
        { name: "destination_city", label: "Cidade de Destino", type: "text", required: true, autocomplete: "city", placeholder: "Ex: Porto Alegre" },
        { name: "destination_state", label: "UF Destino", type: "text", maxlength: 2, required: true, placeholder: "RS" },
        { name: "departure_date", label: "Data de Partida", type: "date", required: true },
        { name: "arrival_date", label: "Data de Chegada", type: "date", required: true },
        { name: "available_weight", label: "Peso Disponível (kg)", type: "number", min: 1, placeholder: "5000" },
        { name: "available_volume", label: "Volume Disponível (m³)", type: "number", min: 1, placeholder: "30" },
        { name: "is_return", label: "É Rota de Retorno?", type: "select", options: [
          { value: "0", label: "Não" },
          { value: "1", label: "Sim" },
        ]},
      ],
      onSubmit: () => {
        Toast.success(routeId ? "Rota atualizada!" : "Rota criada com sucesso!");
        Router.refresh();
      },
    });
  },
};
