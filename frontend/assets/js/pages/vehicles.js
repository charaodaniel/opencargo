/**
 * ── OpenCargo — Vehicles Page ─────────────────────────
 * Gerenciamento de veículos cadastrados.
 */

const VehiclesPage = {
  /**
   * Renderiza a página de veículos
   */
  async render() {
    const vehicles = await Api.get("vehicles");

    return `
      <div class="fade-in">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Veículos</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Gerencie a frota de veículos</p>
          </div>
          <button onclick="VehiclesPage.openForm()" class="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span class="hidden sm:inline">Novo Veículo</span>
          </button>
        </div>

        ${Table.render({
          columns: [
            { key: "model", label: "Modelo", render: (r) => `<span class="font-medium text-gray-900 dark:text-white">${Utils.escapeHtml(r.model)}</span>` },
            { key: "plate", label: "Placa" },
            { key: "capacity_kg", label: "Capacidade", render: (r) => `${Utils.formatNumber(r.capacity_kg)} kg` },
            { key: "capacity_m3", label: "Volume", render: (r) => `${r.capacity_m3} m³` },
            { key: "type", label: "Tipo" },
            {
              key: "status",
              label: "Status",
              render: (r) => `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${Utils.getStatusClass(r.status)}">${Utils.getStatusLabel(r.status)}</span>`,
            },
            {
              key: "actions",
              label: "Ações",
              render: (r) => Table.actions({
                onEdit: `VehiclesPage.openForm(${r.id})`,
                onDelete: `VehiclesPage.confirmDelete(${r.id})`,
              }),
            },
          ],
          data: vehicles,
          emptyMessage: "Nenhum veículo cadastrado.",
        })}
      </div>
    `;
  },

  /**
   * Abre formulário para criar/editar veículo
   */
  openForm(vehicleId = null) {
    const isEdit = !!vehicleId;
    Modal.openForm({
      title: isEdit ? "Editar Veículo" : "Novo Veículo",
      submitText: isEdit ? "Atualizar" : "Criar Veículo",
      fields: [
        { name: "plate", label: "Placa", type: "text", required: true },
        { name: "model", label: "Modelo", type: "text", required: true },
        { name: "year", label: "Ano", type: "number" },
        { name: "capacity_kg", label: "Capacidade (kg)", type: "number", required: true, min: 1 },
        { name: "capacity_m3", label: "Volume (m³)", type: "number", required: true, min: 1 },
        { name: "type", label: "Tipo", type: "select", options: [
          { value: "truck", label: "Caminhão Truck" },
          { value: "carreta", label: "Carreta" },
          { value: "van", label: "Van" },
          { value: "baú", label: "Baú" },
        ]},
        { name: "status", label: "Status", type: "select", options: [
          { value: "active", label: "Ativo" },
          { value: "maintenance", label: "Em Manutenção" },
          { value: "inactive", label: "Inativo" },
        ]},
      ],
      onSubmit: () => {
        Toast.success(isEdit ? "Veículo atualizado!" : "Veículo criado com sucesso!");
        Router.refresh();
      },
    });
  },

  /**
   * Confirma exclusão de veículo
   */
  confirmDelete(id) {
    Modal.confirm("Tem certeza que deseja excluir este veículo?", () => {
      Toast.success("Veículo excluído!");
      Router.refresh();
    });
  },
};
