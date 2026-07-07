/**
 * ── OpenCargo — Drivers Page ──────────────────────────
 * Gerenciamento de motoristas cadastrados.
 */

const DriversPage = {
  /**
   * Renderiza a página de motoristas
   */
  async render() {
    const drivers = await Api.get("drivers");

    return `
      <div class="fade-in">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Motoristas</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Gerencie os motoristas cadastrados</p>
          </div>
          <button onclick="DriversPage.openForm()" class="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span class="hidden sm:inline">Novo Motorista</span>
          </button>
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
          data: drivers,
          emptyMessage: "Nenhum motorista cadastrado.",
        })}
      </div>
    `;
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
      onSubmit: () => {
        Toast.success(isEdit ? "Motorista atualizado!" : "Motorista criado com sucesso!");
        Router.refresh();
      },
    });
  },

  /**
   * Confirma exclusão de motorista
   */
  confirmDelete(id) {
    Modal.confirm("Tem certeza que deseja excluir este motorista?", () => {
      Toast.success("Motorista excluído!");
      Router.refresh();
    });
  },
};
