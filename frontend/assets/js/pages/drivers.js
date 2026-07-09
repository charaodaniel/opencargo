/**
 * ── OpenCargo — Drivers Page ──────────────────────────
 * Gerenciamento de motoristas cadastrados.
 */

const DriversPage = {
  /** Card de filtro ativo */
  _filterCard: "all",

  /**
   * Renderiza a página de motoristas
   */
  async render() {
    const drivers = await Api.get("drivers");
    this._drivers = drivers;

    // Filtra dados conforme card ativo
    const filtered = this._filterCard === "all"
      ? drivers
      : drivers.filter(d => String(d.available) === this._filterCard);

    // Contagens para os cards
    const totalAvailable = drivers.filter(d => d.available).length;
    const totalUnavailable = drivers.filter(d => !d.available).length;

    return `
      <div class="fade-in">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Motoristas</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Gerencie os motoristas cadastrados</p>
          </div>
          <div class="flex items-center space-x-2">
            <button onclick="DriversPage.exportCsv()" class="flex items-center space-x-1.5 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" title="${__("action.exportCsv")}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <span class="hidden sm:inline">${__("action.exportCsv")}</span>
            </button>
            <button onclick="DriversPage.openForm()" class="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              <span class="hidden sm:inline">Novo Motorista</span>
            </button>
          </div>
        </div>

        <!-- Filter Cards -->
        <div class="flex flex-wrap gap-2 mb-6">
          ${this._renderFilterCard("all", "Todos", drivers.length)}
          ${this._renderFilterCard("true", "Disponíveis", totalAvailable)}
          ${this._renderFilterCard("false", "Indisponíveis", totalUnavailable)}
        </div>

        ${Table.render({
          columns: [
            {
              key: "name",
              label: "Nome",
              render: (r) => `
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style="background-color: ${Utils.getAvatarColor(r.name)}">
                    ${Utils.getInitials(r.name)}
                  </div>
                  <span class="font-medium text-gray-900 dark:text-white">${Utils.escapeHtml(r.name)}</span>
                </div>
              `,
            },
            { key: "document", label: "CPF" },
            { key: "cnh", label: "CNH", render: (r) => r.cnh || '<span class="text-gray-400">-</span>' },
            { key: "phone", label: "Telefone" },
            { key: "city", label: "Cidade", render: (r) => `${r.city || "-"}/${r.state || ""}` },
            {
              key: "available",
              label: "Disponibilidade",
              render: (r) => r.available
                ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400">Disponível</span>'
                : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400">Indisponível</span>',
            },
            {
              key: "actions",
              label: "Ações",
              render: (r) => Table.actions({
                onEdit: `DriversPage.openForm(${r.id})`,
                onDelete: `DriversPage.confirmDelete(${r.id})`,
              }),
            },
          ],
          data: filtered,
          emptyMessage: "Nenhum motorista encontrado.",
        })}
      </div>
    `;
  },

  /**
   * Renderiza um card de filtro clicável
   */
  _renderFilterCard(value, label, count) {
    const isActive = this._filterCard === value;
    return `
      <button onclick="DriversPage.setFilterCard('${value}')"
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
   * Define o filtro ativo e recarrega
   */
  setFilterCard(value) {
    this._filterCard = value;
    Router.refresh();
  },

  /**
   * Exporta motoristas como CSV
   */
  exportCsv() {
    Utils.exportCsv(
      this._drivers,
      [
        { key: "name", label: "Nome" },
        { key: "document", label: "CPF" },
        { key: "cnh", label: "CNH" },
        { key: "phone", label: "Telefone" },
        { key: "city", label: "Cidade" },
        { key: "state", label: "UF" },
        { key: "available", label: "Disponível" },
      ],
      "motoristas"
    );
  },

  /**
   * Abre formulário para criar/editar motorista
   */
  openForm(driverId = null) {
    const isEdit = !!driverId;

    Modal.openForm({
      title: isEdit ? "Editar Motorista" : "Novo Motorista",
      submitText: isEdit ? "Atualizar" : "Criar Motorista",
      fields: [
        { name: "name", label: "Nome Completo", type: "text", required: true },
        { name: "document", label: "CPF", type: "text", required: true },
        { name: "cnh", label: "CNH", type: "text" },
        { name: "phone", label: "Telefone", type: "text" },
        { name: "city", label: "Cidade", type: "text" },
        { name: "state", label: "Estado (UF)", type: "text", maxlength: 2 },
      ],
      onSubmit: async (data) => {
        try {
          if (isEdit) {
            await Api.patch(`drivers/${driverId}`, data);
          } else {
            await Api.post("drivers", data);
          }
          Modal.close();
          Toast.success(isEdit ? "Motorista atualizado!" : "Motorista criado com sucesso!");
          Router.refresh();
        } catch (err) {
          Toast.error(err.message || "Erro ao salvar motorista");
        }
      },
    });
  },

  /**
   * Confirma exclusão de motorista
   */
  confirmDelete(id) {
    Modal.confirm("Tem certeza que deseja excluir este motorista?", async () => {
      try {
        await Api.delete("drivers", id);
        Toast.success("Motorista excluído!");
        Router.refresh();
      } catch (err) {
        Toast.error(err.message || "Erro ao excluir motorista");
      }
    });
  },
};
