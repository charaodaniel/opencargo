/**
 * ── OpenCargo — Vehicles Page ─────────────────────────
 * Gerenciamento de veículos cadastrados.
 */

const VehiclesPage = {
  /** Card de filtro ativo */
  _filterCard: "all",

  /**
   * Renderiza a página de veículos
   */
  async render() {
    const vehicles = await Api.get("vehicles");
    this._vehicles = vehicles;

    // Filtra dados conforme card ativo
    const filtered = this._filterCard === "all"
      ? vehicles
      : vehicles.filter(v => v.status === this._filterCard);

    // Contagens para os cards
    const totalActive = vehicles.filter(v => v.status === "active").length;
    const totalMaintenance = vehicles.filter(v => v.status === "maintenance").length;
    const totalInactive = vehicles.filter(v => v.status === "inactive").length;

    return `
      <div class="fade-in">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Veículos</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Gerencie a frota de veículos</p>
          </div>
          <div class="flex items-center space-x-2">
            <button onclick="VehiclesPage.exportCsv()" class="flex items-center space-x-1.5 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" title="${__("action.exportCsv")}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <span class="hidden sm:inline">${__("action.exportCsv")}</span>
            </button>
            <button onclick="VehiclesPage.openForm()" class="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              <span class="hidden sm:inline">Novo Veículo</span>
            </button>
          </div>
        </div>

        <!-- Filter Cards -->
        <div class="flex flex-wrap gap-2 mb-6">
          ${Utils.renderFilterCard({ value: "all", label: "Todos", count: vehicles.length, isActive: this._filterCard === "all", pageNs: "VehiclesPage" })}
          ${Utils.renderFilterCard({ value: "active", label: "Ativos", count: totalActive, isActive: this._filterCard === "active", pageNs: "VehiclesPage" })}
          ${Utils.renderFilterCard({ value: "maintenance", label: "Manutenção", count: totalMaintenance, isActive: this._filterCard === "maintenance", pageNs: "VehiclesPage" })}
          ${Utils.renderFilterCard({ value: "inactive", label: "Inativos", count: totalInactive, isActive: this._filterCard === "inactive", pageNs: "VehiclesPage" })}
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
          data: filtered,
          emptyMessage: "Nenhum veículo encontrado.",
        })}
      </div>
    `;
  },

  /**
   * Define o filtro ativo e recarrega
   */
  setFilterCard(value) {
    this._filterCard = value;
    Router.refresh();
  },

  /**
   * Exporta veículos como CSV
   */
  exportCsv() {
    Utils.exportCsv(
      this._vehicles,
      [
        { key: "model", label: "Modelo" },
        { key: "plate", label: "Placa" },
        { key: "year", label: "Ano" },
        { key: "capacity_kg", label: "Capacidade (kg)" },
        { key: "capacity_m3", label: "Volume (m³)" },
        { key: "type", label: "Tipo" },
        { key: "status", label: "Status" },
      ],
      "veiculos"
    );
  },

  /**
   * Abre formulário para criar/editar veículo
   */
  async openForm(vehicleId = null) {
    const isEdit = !!vehicleId;
    let vehicle = null;
    if (isEdit) {
      const vehicles = await Api.get("vehicles");
      vehicle = vehicles.find(v => v.id === vehicleId);
    }

    Modal.openForm({
      title: isEdit ? "Editar Veículo" : "Novo Veículo",
      submitText: isEdit ? "Atualizar" : "Criar Veículo",
      fields: [
        { name: "plate", label: "Placa", type: "text", required: true, value: vehicle?.plate || "" },
        { name: "model", label: "Modelo", type: "text", required: true, value: vehicle?.model || "" },
        { name: "year", label: "Ano", type: "number", value: vehicle?.year || "" },
        { name: "capacity_kg", label: "Capacidade (kg)", type: "number", required: true, min: 1, value: vehicle?.capacity_kg || "" },
        { name: "capacity_m3", label: "Volume (m³)", type: "number", required: true, min: 1, value: vehicle?.capacity_m3 || "" },
        { name: "type", label: "Tipo", type: "select", value: vehicle?.type || "", options: [
          { value: "truck", label: "Caminhão Truck" },
          { value: "carreta", label: "Carreta" },
          { value: "van", label: "Van" },
          { value: "baú", label: "Baú" },
        ]},
        { name: "status", label: "Status", type: "select", value: vehicle?.status || "active", options: [
          { value: "active", label: "Ativo" },
          { value: "maintenance", label: "Em Manutenção" },
          { value: "inactive", label: "Inativo" },
        ]},
      ],
      onSubmit: async (data) => {
        try {
          const payload = {
            plate: data.plate,
            model: data.model,
            year: data.year ? parseInt(data.year) : undefined,
            capacityKg: parseFloat(data.capacity_kg),
            capacityM3: parseFloat(data.capacity_m3),
            type: data.type || undefined,
            status: data.status || "active",
          };
          if (isEdit) {
            await Api.patch(`vehicles/${vehicleId}`, payload);
          } else {
            await Api.post("vehicles", payload);
          }
          Modal.close();
          Toast.success(isEdit ? "Veículo atualizado!" : "Veículo criado com sucesso!");
          Router.refresh();
        } catch (err) {
          Toast.error(err.message || "Erro ao salvar veículo");
        }
      },
    });
  },

  /**
   * Confirma exclusão de veículo
   */
  confirmDelete(id) {
    Modal.confirm("Tem certeza que deseja excluir este veículo?", async () => {
      try {
        await Api.delete("vehicles", id);
        Toast.success("Veículo excluído!");
        Router.refresh();
      } catch (err) {
        Toast.error(err.message || "Erro ao excluir veículo");
      }
    });
  },
};
