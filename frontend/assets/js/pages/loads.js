/**
 * ── OpenCargo — Loads Page ────────────────────────────
 * Gerenciamento de cargas para transporte.
 */

const LoadsPage = {
  async render() {
    const [loads, companies] = await Promise.all([
      Api.get("loads"),
      Api.get("companies"),
    ]);

    const statusCounts = {};
    loads.forEach((l) => {
      statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    });

    const statusSummary = [
      { status: "pending", label: "Pendentes" },
      { status: "available", label: "Disponíveis" },
      { status: "matched", label: "Compatíveis" },
      { status: "in_transit", label: "Em Trânsito" },
      { status: "delivered", label: "Entregues" },
    ];

    return `
      <div class="fade-in">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Cargas</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Gerencie as cargas para transporte</p>
          </div>
          <button onclick="LoadsPage.openForm()" class="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span class="hidden sm:inline">Nova Carga</span>
          </button>
        </div>

        <!-- Status summary -->
        <div class="flex flex-wrap gap-3 mb-6">
          ${statusSummary
            .map(
              (s) => `
            <div class="flex items-center space-x-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <span class="text-sm font-medium text-gray-900 dark:text-white">${statusCounts[s.status] || 0}</span>
              <span class="text-xs text-gray-500">${s.label}</span>
            </div>
          `
            )
            .join("")}
        </div>

        ${Table.render({
          columns: [
            {
              key: "title",
              label: "Título",
              render: (r) => `<span class="font-medium text-gray-900 dark:text-white">${Utils.escapeHtml(r.title)}</span>`,
            },
            { label: "Origem", render: (r) => `${r.origin_city}/${r.origin_state}` },
            { label: "Destino", render: (r) => `${r.destination_city}/${r.destination_state}` },
            { key: "weight_kg", label: "Peso", render: (r) => `${Utils.formatNumber(r.weight_kg)} kg` },
            { key: "type", label: "Tipo", render: (r) => r.type || "-" },
            { key: "company_name", label: "Empresa" },
            {
              label: "Status",
              render: (r) => Table.statusBadge(r.status),
            },
          ],
          data: loads,
          emptyMessage: "Nenhuma carga cadastrada.",
        })}
      </div>
    `;
  },

  openForm(loadId = null) {
    Modal.openForm({
      title: loadId ? "Editar Carga" : "Nova Carga",
      submitText: loadId ? "Atualizar" : "Criar Carga",
      fields: [
        { name: "title", label: "Título da Carga", type: "text", required: true },
        { name: "description", label: "Descrição", type: "textarea" },
        { name: "origin_city", label: "Cidade de Origem", type: "text", required: true, autocomplete: "city", placeholder: "Ex: São Paulo" },
        { name: "origin_state", label: "UF Origem", type: "text", maxlength: 2, required: true, placeholder: "SP" },
        { name: "destination_city", label: "Cidade de Destino", type: "text", required: true, autocomplete: "city", placeholder: "Ex: Rio de Janeiro" },
        { name: "destination_state", label: "UF Destino", type: "text", maxlength: 2, required: true, placeholder: "RJ" },
        { name: "weight_kg", label: "Peso (kg)", type: "number", required: true, min: 1 },
        { name: "volume_m3", label: "Volume (m³)", type: "number", min: 0.1, step: 0.1 },
        { name: "type", label: "Tipo de Carga", type: "select", options: [
          { value: "", label: "Selecione..." },
          { value: "Carga Geral", label: "Carga Geral" },
          { value: "Carga Frágil", label: "Carga Frágil" },
          { value: "Carga Frigorífica", label: "Carga Frigorífica" },
          { value: "Carga Perigosa", label: "Carga Perigosa" },
          { value: "Granel", label: "Granel" },
        ]},
        { name: "pickup_date", label: "Data de Coleta", type: "date", required: true },
        { name: "delivery_date", label: "Data de Entrega", type: "date", required: true },
      ],
      onSubmit: () => {
        Toast.success(loadId ? "Carga atualizada!" : "Carga criada com sucesso!");
        Router.refresh();
      },
    });
  },
};
