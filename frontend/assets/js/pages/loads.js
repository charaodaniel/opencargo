/**
 * ── OpenCargo — Loads Page ────────────────────────────
 * Gerenciamento de cargas para transporte.
 */

const LoadsPage = {
  /** Card de filtro ativo */
  _filterCard: "all",

  async render() {
    const [loads, companies] = await Promise.all([
      Api.get("loads"),
      Api.get("companies"),
    ]);
    this._loads = loads;

    // Filtra dados conforme card ativo
    const filtered = this._filterCard === "all"
      ? loads
      : loads.filter(l => l.status === this._filterCard);

    // Contagens para os cards
    const statusOrder = ["pending", "available", "matched", "in_transit", "delivered", "cancelled"];
    const statusLabels = {
      pending: "Pendentes", available: "Disponíveis", matched: "Compatíveis",
      in_transit: "Em Trânsito", delivered: "Entregues", cancelled: "Canceladas",
    };

    return `
      <div class="fade-in">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Cargas</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Gerencie as cargas para transporte</p>
          </div>
          <div class="flex items-center space-x-2">
            <button onclick="LoadsPage.exportCsv()" class="flex items-center space-x-1.5 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" title="${__("action.exportCsv")}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <span class="hidden sm:inline">${__("action.exportCsv")}</span>
            </button>
            <button onclick="LoadsPage.openForm()" class="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              <span class="hidden sm:inline">Nova Carga</span>
            </button>
          </div>
        </div>

        <!-- Filter Cards -->
        <div class="flex flex-wrap gap-2 mb-6">
          ${Utils.renderFilterCard({ value: "all", label: "Todas", count: loads.length, isActive: this._filterCard === "all", pageNs: "LoadsPage" })}
          ${statusOrder.map(s => Utils.renderFilterCard({ value: s, label: statusLabels[s], count: loads.filter(l => l.status === s).length, isActive: this._filterCard === s, pageNs: "LoadsPage" })).join("")}
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
            {
              key: "actions",
              label: "Ações",
              render: (r) => Table.actions({
                onEdit: `LoadsPage.openForm(${r.id})`,
                onDelete: `LoadsPage.confirmDelete(${r.id})`,
              }),
            },
          ],
          data: filtered,
          emptyMessage: "Nenhuma carga encontrada.",
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
   * Confirma exclusão de carga
   */
  confirmDelete(id) {
    Modal.confirm("Tem certeza que deseja excluir esta carga?", async () => {
      try {
        await Api.delete("loads", id);
        Toast.success("Carga excluída!");
        Router.refresh();
      } catch (err) {
        Toast.error(err.message || "Erro ao excluir carga");
      }
    });
  },

  /**
   * Abre formulário para criar/editar carga
   */
  async openForm(loadId = null) {
    let load = null;
    if (loadId) {
      const loads = await Api.get("loads");
      load = loads.find(l => l.id === loadId);
    }

    Modal.openForm({
      title: loadId ? "Editar Carga" : "Nova Carga",
      submitText: loadId ? "Atualizar" : "Criar Carga",
      fields: [
        { name: "title", label: "Título da Carga", type: "text", required: true, value: load?.title || "" },
        { name: "description", label: "Descrição", type: "textarea", value: load?.description || "" },
        { name: "origin_city", label: "Cidade de Origem", type: "text", required: true, autocomplete: "city", placeholder: "Ex: São Paulo", value: load?.origin_city || "" },
        { name: "origin_state", label: "UF Origem", type: "text", maxlength: 2, required: true, placeholder: "SP", value: load?.origin_state || "" },
        { name: "destination_city", label: "Cidade de Destino", type: "text", required: true, autocomplete: "city", placeholder: "Ex: Rio de Janeiro", value: load?.destination_city || "" },
        { name: "destination_state", label: "UF Destino", type: "text", maxlength: 2, required: true, placeholder: "RJ", value: load?.destination_state || "" },
        { name: "weight_kg", label: "Peso (kg)", type: "number", required: true, min: 1, value: load?.weight_kg || "" },
        { name: "volume_m3", label: "Volume (m³)", type: "number", min: 0.1, step: 0.1, value: load?.volume_m3 || "" },
        { name: "type", label: "Tipo de Carga", type: "select", value: load?.type || "", options: [
          { value: "", label: "Selecione..." },
          { value: "Carga Geral", label: "Carga Geral" },
          { value: "Carga Frágil", label: "Carga Frágil" },
          { value: "Carga Frigorífica", label: "Carga Frigorífica" },
          { value: "Carga Perigosa", label: "Carga Perigosa" },
          { value: "Granel", label: "Granel" },
        ]},
        { name: "pickup_date", label: "Data de Coleta", type: "date", required: true, value: load?.pickup_date || "" },
        { name: "delivery_date", label: "Data de Entrega", type: "date", required: true, value: load?.delivery_date || "" },
      ],
      onSubmit: async (data) => {
        try {
          const payload = {
            title: data.title,
            description: data.description || undefined,
            originCity: data.origin_city,
            originState: data.origin_state,
            destinationCity: data.destination_city,
            destinationState: data.destination_state,
            weightKg: parseFloat(data.weight_kg),
            volumeM3: data.volume_m3 ? parseFloat(data.volume_m3) : undefined,
            type: data.type || undefined,
            pickupDate: data.pickup_date,
            deliveryDate: data.delivery_date,
          };
          if (loadId) {
            await Api.patch(`loads/${loadId}`, payload);
          } else {
            await Api.post("loads", payload);
          }
          Modal.close();
          Toast.success(loadId ? "Carga atualizada!" : "Carga criada com sucesso!");
          Router.refresh();
        } catch (err) {
          Toast.error(err.message || "Erro ao salvar carga");
        }
      },
    });
  },
};
