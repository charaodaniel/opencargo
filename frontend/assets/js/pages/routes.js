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

    const activeRoutes = routes.filter((r) => r.status === "active").length;
    const returnRoutes = routes.filter((r) => r.is_return).length;

    return `
      <div class="fade-in">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Rotas</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Gerencie as rotas de viagem</p>
          </div>
          <button onclick="RoutesPage.openForm()" class="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span class="hidden sm:inline">Nova Rota</span>
          </button>
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
                ? '<span class="text-green-600 dark:text-green-400 font-medium">✅ Sim</span>'
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

  openForm(routeId = null) {
    Modal.openForm({
      title: routeId ? "Editar Rota" : "Nova Rota",
      submitText: routeId ? "Atualizar" : "Criar Rota",
      fields: [
        { name: "origin_city", label: "Cidade de Origem", type: "text", required: true },
        { name: "origin_state", label: "UF Origem", type: "text", maxlength: 2, required: true },
        { name: "destination_city", label: "Cidade de Destino", type: "text", required: true },
        { name: "destination_state", label: "UF Destino", type: "text", maxlength: 2, required: true },
        { name: "departure_date", label: "Data de Partida", type: "date", required: true },
        { name: "arrival_date", label: "Data de Chegada", type: "date", required: true },
        { name: "available_weight", label: "Peso Disponível (kg)", type: "number", min: 1 },
        { name: "available_volume", label: "Volume Disponível (m³)", type: "number", min: 1 },
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
