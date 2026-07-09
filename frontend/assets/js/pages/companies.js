/**
 * ── OpenCargo — Companies Page ────────────────────────
 * Gerenciamento de empresas cadastradas.
 */

const CompaniesPage = {
  /**
   * Renderiza a página de empresas
   */
  async render() {
    const companies = await Api.get("companies");
    this._companies = companies;

    return `
      <div class="fade-in">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Empresas</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Gerencie as empresas transportadoras</p>
          </div>
          <div class="flex items-center space-x-2">
            <button onclick="CompaniesPage.exportCsv()" class="flex items-center space-x-1.5 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" title="${__("action.exportCsv")}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <span class="hidden sm:inline">${__("action.exportCsv")}</span>
            </button>
            <button onclick="CompaniesPage.openForm()" class="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              <span class="hidden sm:inline">Nova Empresa</span>
            </button>
          </div>
        </div>

        ${Table.render({
          columns: [
            { key: "name", label: "Nome", render: (r) => `<span class="font-medium text-gray-900 dark:text-white">${Utils.escapeHtml(r.name)}</span>` },
            { key: "city", label: "Cidade", render: (r) => `${r.city || "-"}/${r.state || ""}` },
            { key: "phone", label: "Telefone" },
            { key: "document", label: "CNPJ" },
            {
              key: "active",
              label: "Status",
              render: (r) => r.active
                ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400">Ativa</span>'
                : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400">Inativa</span>',
            },
            {
              key: "actions",
              label: "Ações",
              render: (r) => Table.actions({
                onEdit: `CompaniesPage.openForm(${r.id})`,
                onDelete: `CompaniesPage.confirmDelete(${r.id})`,
              }),
            },
          ],
          data: companies,
          emptyMessage: "Nenhuma empresa cadastrada. Clique em 'Nova Empresa' para começar.",
        })}
      </div>
    `;
  },

  /**
   * Exporta empresas como CSV
   */
  exportCsv() {
    Utils.exportCsv(
      this._companies,
      [
        { key: "name", label: "Nome" },
        { key: "document", label: "CNPJ" },
        { key: "city", label: "Cidade" },
        { key: "state", label: "UF" },
        { key: "phone", label: "Telefone" },
        { key: "active", label: "Ativo" },
        { key: "address", label: "Endereço" },
      ],
      "empresas"
    );
  },

  /**
   * Abre formulário para criar/editar empresa
   */
  async openForm(companyId = null) {
    const isEdit = !!companyId;
    let company = null;
    if (isEdit) {
      const companies = await Api.get("companies");
      company = companies.find((c) => c.id === companyId);
    }

    Modal.openForm({
      title: isEdit ? "Editar Empresa" : "Nova Empresa",
      submitText: isEdit ? "Atualizar" : "Criar Empresa",
      fields: [
        { name: "name", label: "Nome da Empresa", type: "text", required: true, value: company?.name || "" },
        { name: "document", label: "CNPJ", type: "text", required: true, value: company?.document || "" },
        { name: "address", label: "Endereço", type: "text", value: company?.address || "" },
        { name: "city", label: "Cidade", type: "text", value: company?.city || "" },
        { name: "state", label: "Estado (UF)", type: "text", maxlength: 2, value: company?.state || "" },
        { name: "phone", label: "Telefone", type: "text", value: company?.phone || "" },
      ],
      onSubmit: async (data) => {
        try {
          if (isEdit) {
            await Api.patch(`companies/${companyId}`, data);
          } else {
            await Api.post("companies", data);
          }
          Modal.close();
          Toast.success(isEdit ? "Empresa atualizada com sucesso!" : "Empresa criada com sucesso!");
          Router.refresh();
        } catch (err) {
          Toast.error(err.message || "Erro ao salvar empresa");
        }
      },
    });
  },

  /**
   * Confirma exclusão de empresa
   */
  confirmDelete(id) {
    Modal.confirm("Tem certeza que deseja excluir esta empresa?", async () => {
      try {
        await Api.delete("companies", id);
        Toast.success("Empresa excluída com sucesso!");
        Router.refresh();
      } catch (err) {
        Toast.error(err.message || "Erro ao excluir empresa");
      }
    });
  },
};
