/**
 * ── OpenCargo — Documents Page ────────────────────────
 * Upload, listagem e gerenciamento de documentos.
 * Suporta: PDF, imagens, DOC, XLS, TXT
 */

const DocumentsPage = {
  _filterType: "",
  _files: [],

  async render() {
    this._files = await this._fetchDocuments();
    return this._buildHTML();
  },

  async _fetchDocuments() {
    try {
      const params = this._filterType ? `?entityType=${this._filterType}` : "";
      return await Api.get(`documents${params}`);
    } catch {
      return [];
    }
  },

  _buildHTML() {
    const files = this._files;

    const categoryCounts = {};
    files.forEach((f) => {
      categoryCounts[f.entity_type] = (categoryCounts[f.entity_type] || 0) + 1;
    });

    const categories = [
      { key: "", label: "Todos", count: files.length },
      { key: "general", label: "Gerais", count: categoryCounts.general || 0 },
      { key: "company", label: "Empresas", count: categoryCounts.company || 0 },
      { key: "driver", label: "Motoristas", count: categoryCounts.driver || 0 },
      { key: "vehicle", label: "Veículos", count: categoryCounts.vehicle || 0 },
      { key: "load", label: "Cargas", count: categoryCounts.load || 0 },
    ];

    return `
      <div class="fade-in">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Documentos</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Gerencie seus documentos e arquivos</p>
          </div>
          <button onclick="DocumentsPage.openUploadModal()"
            class="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            <span class="hidden sm:inline">Upload</span>
          </button>
        </div>

        <!-- Stats -->
        <div class="flex flex-wrap gap-2 mb-6">
          ${categories.map((c) => `
            <button onclick="DocumentsPage.filter('${c.key}')"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                this._filterType === c.key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              }">
              ${c.label} (${c.count})
            </button>
          `).join("")}
        </div>

        <!-- Document list -->
        ${files.length === 0 ? this._renderEmpty() : this._renderList(files)}
      </div>
    `;
  },

  _renderEmpty() {
    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <div class="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Nenhum documento</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Faça upload de documentos como CNH, comprovantes, notas fiscais e outros arquivos.
        </p>
        <button onclick="DocumentsPage.openUploadModal()"
          class="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium inline-flex items-center space-x-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
          <span>Fazer Upload</span>
        </button>
      </div>
    `;
  },

  _renderList(files) {
    const typeIcons = {
      pdf: "📄",
      jpg: "🖼️",
      jpeg: "🖼️",
      png: "🖼️",
      webp: "🖼️",
      doc: "📝",
      docx: "📝",
      xls: "📊",
      xlsx: "📊",
      txt: "📃",
    };

    const typeLabels = {
      general: "Geral",
      company: "Empresa",
      driver: "Motorista",
      vehicle: "Veículo",
      load: "Carga",
    };

    const formatSize = (bytes) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${files.map((f) => {
          const ext = f.original_name.split(".").pop()?.toLowerCase() || "";
          const icon = typeIcons[ext] || "📎";

          return `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 group">
              <div class="flex items-start space-x-3">
                <div class="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-xl shrink-0">
                  ${icon}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate" title="${Utils.escapeHtml(f.original_name)}">
                    ${Utils.escapeHtml(f.original_name)}
                  </p>
                  <div class="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <span>${formatSize(f.size_bytes)}</span>
                    <span>·</span>
                    <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700">
                      ${typeLabels[f.entity_type] || f.entity_type}
                    </span>
                  </div>
                  <p class="text-xs text-gray-400 mt-1">${Utils.formatDate(f.created_at, true)}</p>
                </div>
              </div>
              <div class="flex items-center justify-end space-x-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                <a href="${CONFIG.API_BASE_URL || ""}/documents/${f.id}/download"
                  class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center space-x-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <span>Download</span>
                </a>
                <button onclick="DocumentsPage.confirmDelete('${f.id}')"
                  class="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium flex items-center space-x-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  },

  /**
   * Abre modal de upload
   */
  openUploadModal() {
    const modalHtml = `
      <div class="space-y-4">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
          <select id="upload-entity-type"
            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white">
            <option value="general">Geral</option>
            <option value="company">Empresa</option>
            <option value="driver">Motorista</option>
            <option value="vehicle">Veículo</option>
            <option value="load">Carga</option>
          </select>
        </div>

        <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
          id="upload-dropzone"
          onclick="document.getElementById('upload-file-input').click()"
          ondragover="event.preventDefault(); this.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20')"
          ondragleave="this.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20')"
          ondrop="event.preventDefault(); DocumentsPage.handleDrop(event)">
          <input type="file" id="upload-file-input" class="hidden" onchange="DocumentsPage.handleFileSelect(event)" />
          <svg class="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
            <span class="text-blue-600 dark:text-blue-400">Clique para selecionar</span> ou arraste o arquivo aqui
          </p>
          <p class="text-xs text-gray-400 mt-1">PDF, imagens, DOC, XLS, TXT — até 10MB</p>
          <div id="upload-file-info" class="mt-3 hidden">
            <div class="inline-flex items-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span id="upload-file-icon" class="text-lg">📄</span>
              <span id="upload-file-name" class="text-sm font-medium text-gray-900 dark:text-white"></span>
            </div>
          </div>
        </div>
      </div>
    `;

    Modal.open({
      title: "Upload de Documento",
      body: modalHtml,
      footer: `
        <div class="flex space-x-3">
          <button type="button" onclick="Modal.close()"
            class="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
            Cancelar
          </button>
          <button type="button" onclick="DocumentsPage.submitUpload()" id="upload-submit-btn"
            class="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium" disabled>
            Enviar
          </button>
        </div>
      `,
    });
  },

  _selectedFile: null,

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) this._showFileInfo(file);
  },

  handleDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) this._showFileInfo(file);
    document.getElementById("upload-dropzone")?.classList.remove("border-blue-500", "bg-blue-50", "dark:bg-blue-900/20");
  },

  _showFileInfo(file) {
    this._selectedFile = file;
    const submitBtn = document.getElementById("upload-submit-btn");
    const info = document.getElementById("upload-file-info");
    const name = document.getElementById("upload-file-name");
    const dropzone = document.getElementById("upload-dropzone");

    if (submitBtn) submitBtn.disabled = false;
    if (info) info.classList.remove("hidden");
    if (name) name.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    if (dropzone) {
      dropzone.classList.add("border-blue-500", "bg-blue-50", "dark:bg-blue-900/20");
    }
  },

  async submitUpload() {
    if (!this._selectedFile) return;

    const submitBtn = document.getElementById("upload-submit-btn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Enviando...";
    }

    try {
      const formData = new FormData();
      formData.append("file", this._selectedFile);
      formData.append("entityType", document.getElementById("upload-entity-type")?.value || "general");

      let apiUrl = `${CONFIG.API_BASE_URL}/documents/upload`;
      if (!CONFIG.API_BASE_URL) {
        Toast.warning("Modo mock: upload não disponível. Conecte ao backend.");
        Modal.close();
        return;
      }

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Storage.getToken()}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro no upload");
      }

      Toast.success("Documento enviado com sucesso!");
      Modal.close();
      this._selectedFile = null;
      Router.refresh();
    } catch (error) {
      Toast.error(error.message || "Erro ao enviar documento");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Enviar";
      }
    }
  },

  /**
   * Filtra por tipo
   */
  filter(type) {
    this._filterType = type;
    Router.refresh();
  },

  /**
   * Confirma exclusão
   */
  confirmDelete(id) {
    Modal.confirm("Tem certeza que deseja excluir este documento?", async () => {
      try {
        if (!CONFIG.API_BASE_URL) {
          Toast.warning("Modo mock: exclusão não disponível.");
          return;
        }
        const res = await fetch(`${CONFIG.API_BASE_URL}/documents/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${Storage.getToken()}`,
          },
        });
        if (!res.ok) throw new Error("Erro ao excluir");
        Toast.success("Documento excluído!");
        Router.refresh();
      } catch (error) {
        Toast.error(error.message || "Erro ao excluir documento");
      }
    });
  },
};
