/**
 * ── OpenCargo — Modal Component ───────────────────────
 * Sistema de modais reutilizáveis para formulários e
 * diálogos de confirmação.
 */

const Modal = {
  /** Container do modal */
  element: null,
  backdrop: null,
  content: null,

  /** Callback para submit do formulário */
  _onSubmit: null,

  /**
   * Inicializa o modal
   */
  init() {
    if (this.element) return;

    // Backdrop
    this.backdrop = document.createElement("div");
    this.backdrop.id = "modal-backdrop";
    this.backdrop.className =
      "fixed inset-0 z-40 bg-black bg-opacity-50 backdrop-blur-sm hidden transition-opacity duration-300";

    // Container do modal
    this.element = document.createElement("div");
    this.element.id = "modal-container";
    this.element.className =
      "fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto hidden";

    this.element.innerHTML = `
      <div id="modal-content" class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto transform scale-95 opacity-0 transition-all duration-300">
        <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 id="modal-title" class="text-lg font-bold text-gray-900 dark:text-white"></h3>
          <button id="modal-close" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div id="modal-body" class="p-6"></div>
        <div id="modal-footer" class="px-6 pb-6 hidden"></div>
      </div>
    `;

    document.body.appendChild(this.backdrop);
    document.body.appendChild(this.element);

    // Eventos
    this.backdrop.addEventListener("click", () => this.close());
    this.element.addEventListener("click", (e) => {
      // Fecha se clicou no scroll/padding fora do modal-content
      if (e.target === this.element) this.close();
    });
    this.element.querySelector("#modal-close").addEventListener("click", () => this.close());

    // Fecha com ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.close();
    });
  },

  /**
   * Abre o modal com conteúdo customizado
   * @param {Object} options
   * @param {string} options.title - Título do modal
   * @param {string} options.body - HTML do conteúdo
   * @param {string} options.footer - HTML do rodapé (opcional)
   * @param {Function} options.onSubmit - Callback de submit (opcional)
   */
  open({ title, body, footer, onSubmit } = {}) {
    this.init();

    this.element.querySelector("#modal-title").textContent = title || "";
    this.element.querySelector("#modal-body").innerHTML = body || "";
    const footerEl = this.element.querySelector("#modal-footer");

    if (footer) {
      footerEl.innerHTML = footer;
      footerEl.classList.remove("hidden");
    } else {
      footerEl.classList.add("hidden");
    }

    this._onSubmit = onSubmit || null;

    // Mostra com animação
    this.backdrop.classList.remove("hidden");
    this.element.classList.remove("hidden");

    requestAnimationFrame(() => {
      this.element.querySelector("#modal-content").classList.remove("scale-95", "opacity-0");
      this.backdrop.classList.remove("opacity-0");
    });

    // Foca no primeiro input
    const firstInput = this.element.querySelector("input, select, textarea");
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
  },

  /**
   * Abre um formulário genérico
   * @param {Object} options
   */
  openForm({ title, fields, submitText = "Salvar", onSubmit }) {
    const body = fields
      .map(
        (f) => `
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${Utils.escapeHtml(f.label)}</label>
        ${this._renderField(f)}
      </div>
    `
      )
      .join("");

    const footer = `
      <div class="flex space-x-3">
        <button type="button" onclick="Modal.close()" class="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
          Cancelar
        </button>
        <button type="button" onclick="Modal._submitForm()" class="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          ${submitText}
        </button>
      </div>
    `;

    this.open({ title, body: `<form id="modal-form" onsubmit="event.preventDefault(); Modal._submitForm()">${body}</form>`, footer, onSubmit });

    // Preenche valores se fornecidos
    fields.forEach((f) => {
      if (f.value !== undefined) {
        const input = document.getElementById(`modal-field-${f.name}`);
        if (input) input.value = f.value;
      }
    });
  },

  /**
   * Abre diálogo de confirmação
   * @param {string} message
   * @param {Function} onConfirm
   * @param {string} confirmText
   */
  confirm(message, onConfirm, confirmText = "Confirmar") {
    const body = `<p class="text-gray-600 dark:text-gray-400">${Utils.escapeHtml(message)}</p>`;
    const footer = `
      <div class="flex space-x-3">
        <button type="button" onclick="Modal.close()" class="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">Cancelar</button>
        <button type="button" onclick="Modal._confirmAction()" class="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">${confirmText}</button>
      </div>
    `;
    this._onConfirm = onConfirm;
    this.open({ title: "Confirmação", body, footer });
  },

  _confirmAction() {
    if (this._onConfirm) this._onConfirm();
    this.close();
  },

  /**
   * Renderiza campo de formulário
   */
  _renderField(field) {
    const id = `modal-field-${field.name}`;
    const value = field.value || "";

    if (field.type === "select") {
      const options = (field.options || [])
        .map((o) => `<option value="${o.value}" ${o.value === value ? "selected" : ""}>${Utils.escapeHtml(o.label)}</option>`)
        .join("");
      return `<select id="${id}" name="${field.name}" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" ${field.required ? "required" : ""}>${options}</select>`;
    }

    if (field.type === "textarea") {
      return `<textarea id="${id}" name="${field.name}" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" rows="3" ${field.required ? "required" : ""}>${value}</textarea>`;
    }

    // Campo com autocomplete de cidades (via Nominatim)
    if (field.autocomplete === "city") {
      const inputId = `modal-field-city-${field.name}`;
      // Cria o HTML do autocomplete e agenda a inicialização
      requestAnimationFrame(() => {
        Geocoding.initAutocomplete({
          inputId,
          onSelect: (result) => {
            // Preenche também o campo de estado se existir
            const stateField = document.getElementById(`modal-field-${field.name.replace("_city", "_state")}`);
            if (stateField && result.state) stateField.value = result.state;
          },
          debounce: 400,
        });
      });
      return Geocoding.createAutocomplete({
        placeholder: field.placeholder || "Digite o nome da cidade...",
        id: inputId,
        name: field.name,
        value: String(value),
      });
    }

    return `<input type="${field.type || "text"}" id="${id}" name="${field.name}" value="${Utils.escapeHtml(String(value))}" placeholder="${Utils.escapeHtml(field.placeholder || "")}" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" ${field.required ? "required" : ""} ${field.min ? `min="${field.min}"` : ""} ${field.max ? `max="${field.max}"` : ""} />`;
  },

  /**
   * Submete o formulário do modal
   */
  _submitForm() {
    const form = document.getElementById("modal-form");
    if (!form) return;

    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    if (this._onSubmit) {
      this._onSubmit(data);
    }
  },

  /**
   * Fecha o modal
   */
  close() {
    if (!this.element) return;

    const content = this.element.querySelector("#modal-content");
    content.classList.add("scale-95", "opacity-0");
    this.backdrop.classList.add("opacity-0");

    setTimeout(() => {
      this.backdrop.classList.add("hidden");
      this.element.classList.add("hidden");
    }, 300);

    this._onSubmit = null;
    this._onConfirm = null;
  },
};
