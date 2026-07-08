/**
 * ── OpenCargo — Sidebar Component ─────────────────────
 * Sidebar fixa com sub-menus agrupados, colapso animado
 * e modo apenas ícones (inspirado no CityMotion/NexusOS).
 *
 * Recursos:
 * - Sub-menus colapsáveis (Gestão, Operações, Comunicação, Conta)
 * - Modo expandido ↔ apenas ícones (desktop)
 * - Overlay em mobile
 * - Estado persistido no Storage
 * - Transições suaves com CSS
 * - Destaque na página ativa via data-attributes
 * - Tooltips nos itens em modo colapsado
 */

const Sidebar = {
  /** Estado da sidebar em mobile */
  _isOpen: false,

  /** Sidebar colapsada? (desktop) */
  _collapsed: false,

  /** Sub-menus abertos */
  _openGroups: {},

  /** Ícones SVG */
  _icons: {
    dashboard: `<svg class="w-5 h-5 icon-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`,
    companies: `<svg class="w-5 h-5 icon-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`,
    drivers: `<svg class="w-5 h-5 icon-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`,
    vehicles: `<svg class="w-5 h-5 icon-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`,
    routes: `<svg class="w-5 h-5 icon-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>`,
    loads: `<svg class="w-5 h-5 icon-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>`,
    matching: `<svg class="w-5 h-5 icon-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>`,
    maps: `<svg class="w-5 h-5 icon-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>`,
    chat: `<svg class="w-5 h-5 icon-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>`,
    documents: `<svg class="w-5 h-5 icon-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>`,
    reviews: `<svg class="w-5 h-5 icon-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>`,
    freights: `<svg class="w-5 h-5 icon-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>`,
    notifications: `<svg class="w-5 h-5 icon-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>`,
    settings: `<svg class="w-5 h-5 icon-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
    profile: `<svg class="w-5 h-5 icon-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`,
    collapseLeft: `<svg class="w-4 h-4 icon-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/></svg>`,
    collapseRight: `<svg class="w-4 h-4 icon-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>`,
    chevronDown: `<svg class="w-4 h-4 icon-rotate" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>`,
  },

  /** Estrutura de sub-menus */
  _groups: [
    {
      id: "gestao",
      labelKey: "sidebar.gestao",
      items: [
        { icon: "dashboard", labelKey: "nav.dashboard", page: "dashboard" },
        { icon: "companies", labelKey: "nav.companies", page: "companies" },
        { icon: "drivers", labelKey: "nav.drivers", page: "drivers" },
        { icon: "vehicles", labelKey: "nav.vehicles", page: "vehicles" },
      ],
    },
    {
      id: "operacoes",
      labelKey: "sidebar.operacoes",
      items: [
        { icon: "routes", labelKey: "nav.routes", page: "routes" },
        { icon: "loads", labelKey: "nav.loads", page: "loads" },
        { icon: "matching", labelKey: "nav.matching", page: "matching" },
        { icon: "documents", labelKey: "nav.documents", page: "documents" },
        { icon: "freights", labelKey: "nav.freights", page: "freights" },
      ],
    },
    {
      id: "comunicacao",
      labelKey: "sidebar.comunicacao",
      items: [
        { icon: "maps", labelKey: "nav.maps", page: "maps" },
        { icon: "chat", labelKey: "nav.chat", page: "chat" },
        { icon: "reviews", labelKey: "nav.reviews", page: "reviews" },
        { icon: "notifications", labelKey: "nav.notifications", page: "notifications" },
      ],
    },
    {
      id: "conta",
      labelKey: "sidebar.conta",
      items: [
        { icon: "profile", labelKey: "nav.profile", page: "profile" },
        { icon: "settings", labelKey: "nav.settings", page: "settings" },
      ],
    },
  ],

  /**
   * Inicializa o estado da sidebar
   */
  init() {
    this._collapsed = Storage.get("sidebar_collapsed", false);
    this._groups.forEach((g) => {
      this._openGroups[g.id] = Storage.get(`sidebar_group_${g.id}`, true);
    });
  },

  /**
   * Renderiza a sidebar
   * @param {string} currentPage - Página ativa
   * @returns {string} HTML da sidebar
   */
  render(currentPage = "dashboard") {
    const isCollapsed = this._collapsed;

    return `
      <aside id="sidebar"
        data-collapsed="${isCollapsed}"
        class="fixed inset-y-0 left-0 z-40 flex flex-col border-r
               bg-sidebar text-sidebar-foreground border-sidebar-border
               transition-all duration-300 ease-in-out
               ${isCollapsed ? "w-16" : "w-64"}
               -translate-x-full lg:translate-x-0">

        <!-- Logo -->
        <div class="flex items-center h-16 px-4 border-b border-sidebar-border shrink-0">
          <a href="#" onclick="Router.go('dashboard'); return false;"
             class="sidebar-logo flex items-center ${isCollapsed ? "justify-center w-full" : "space-x-3"}">
            <div class="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
              <svg class="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div class="${isCollapsed ? "hidden" : "block"} overflow-hidden">
              <p class="text-sm font-bold text-sidebar-foreground leading-tight">OpenCargo</p>
              <p class="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider font-medium">
                ${I18n.locale === "pt-BR" ? "Logística" : "Logistics"}
              </p>
            </div>
          </a>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-1 sidebar-scrollbar">
          ${this._groups.map((group) => this._renderGroup(group, currentPage)).join("")}
        </nav>

        <!-- Footer -->
        <div class="border-t border-sidebar-border p-2 shrink-0">
          <button onclick="Sidebar.toggleCollapse()"
            class="hidden lg:flex w-full items-center justify-center p-2 rounded-lg
                   text-sidebar-foreground/50 hover:text-sidebar-foreground
                   hover:bg-sidebar-accent transition-all duration-200"
            title="${isCollapsed ? __("sidebar.expand") : __("sidebar.collapse")}">
            ${isCollapsed ? this._icons.collapseRight : this._icons.collapseLeft}
          </button>
          <div class="text-center mt-1 ${isCollapsed ? "hidden" : "block"}">
            <p class="text-[10px] text-sidebar-foreground/30">v0.1.0</p>
          </div>
        </div>
      </aside>

      <!-- Mobile overlay -->
      <div id="sidebar-overlay"
        class="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm hidden lg:hidden transition-opacity duration-300"
        onclick="Sidebar.close()"></div>
    `;
  },

  /**
   * Renderiza um grupo (sub-menu)
   */
  _renderGroup(group, currentPage) {
    const isCollapsed = this._collapsed;
    const isOpen = this._openGroups[group.id] !== false;

    return `
      <div class="sidebar-group" data-group="${group.id}">
        <!-- Group header / toggle -->
        <button onclick="Sidebar.toggleGroup('${group.id}')"
          class="group-header flex w-full items-center px-2 py-1.5 rounded-md
                 text-[10px] font-bold uppercase tracking-widest
                 text-sidebar-foreground/40 hover:text-sidebar-foreground/70
                 transition-colors duration-150 ${isCollapsed ? "justify-center" : ""}"
          title="${isCollapsed ? __(group.labelKey) : ""}">
          ${isCollapsed ? "" : `<span class="truncate">${__(group.labelKey)}</span>`}
          ${isCollapsed ? "" : `
            <span class="ml-auto transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}">
              ${this._icons.chevronDown}
            </span>
          `}
        </button>

        <!-- Group items -->
        <div class="sidebar-group-content overflow-hidden transition-all duration-200 ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}">
          <div class="space-y-0.5 ${isCollapsed ? "" : "pl-2"}">
            ${group.items.map((item) => this._renderItem(item, currentPage)).join("")}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Renderiza um item de menu com data-page e tooltip
   */
  _renderItem(item, currentPage) {
    const isCollapsed = this._collapsed;
    const isActive = currentPage === item.page;
    const label = __(item.labelKey);

    return `
      <button data-page="${item.page}"
        onclick="Sidebar.navigate('${item.page}')"
        ${isCollapsed ? `title="${label}"` : ""}
        class="sidebar-link group flex w-full items-center rounded-lg text-sm transition-all duration-150
               ${isCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-2 space-x-3"}
               ${isActive
                 ? "bg-primary/10 text-primary font-semibold border-r-2 border-primary"
                 : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"}">
        <span class="shrink-0 ${isActive ? "text-primary" : ""}">${this._icons[item.icon] || this._icons.dashboard}</span>
        <span class="${isCollapsed ? "hidden" : "block"} truncate">${label}</span>
      </button>
    `;
  },

  // ═══ Actions ═════════════════════════════════════

  /**
   * Navega para uma página
   */
  navigate(page) {
    this.close();
    Router.go(page);
  },

  /**
   * Abre/fecha a sidebar em mobile
   */
  toggle() {
    this._isOpen = !this._isOpen;
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (sidebar) sidebar.classList.toggle("-translate-x-full", !this._isOpen);
    if (overlay) overlay.classList.toggle("hidden", !this._isOpen);
  },

  /**
   * Fecha a sidebar em mobile
   */
  close() {
    this._isOpen = false;
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (sidebar) sidebar.classList.add("-translate-x-full");
    if (overlay) overlay.classList.add("hidden");
  },

  /**
   * Alterna colapso da sidebar (desktop) — modo ícones
   */
  toggleCollapse() {
    this._collapsed = !this._collapsed;
    Storage.set("sidebar_collapsed", this._collapsed);

    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
      sidebar.dataset.collapsed = this._collapsed;
      sidebar.classList.toggle("w-64", !this._collapsed);
      sidebar.classList.toggle("w-16", this._collapsed);
    }

    // Fecha todos os grupos ao colapsar
    if (this._collapsed) {
      this._closeAllGroups();
    }

    this._updateCollapsedUI();
  },

  /**
   * Fecha todos os sub-menus
   */
  _closeAllGroups() {
    this._groups.forEach((g) => {
      this._openGroups[g.id] = false;
      Storage.set(`sidebar_group_${g.id}`, false);
    });

    document.querySelectorAll(".sidebar-group").forEach((el) => {
      const content = el.querySelector(".sidebar-group-content");
      const chevron = el.querySelector(".group-header svg:last-child");
      if (content) {
        content.classList.remove("max-h-96", "opacity-100");
        content.classList.add("max-h-0", "opacity-0");
      }
      if (chevron) {
        chevron.classList.remove("rotate-0");
        chevron.classList.add("-rotate-90");
      }
    });
  },

  /**
   * Atualiza UI após colapso sem re-render completo
   */
  _updateCollapsedUI() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;

    const isCollapsed = this._collapsed;

    // Logo
    const logoLink = sidebar.querySelector("a");
    if (logoLink) {
      logoLink.className = `sidebar-logo flex items-center ${isCollapsed ? "justify-center w-full" : "space-x-3"}`;
      const logoText = logoLink.querySelector("div:last-child");
      if (logoText) logoText.classList.toggle("hidden", isCollapsed);
    }

    // Groups
    sidebar.querySelectorAll(".sidebar-group").forEach((groupEl) => {
      const header = groupEl.querySelector(".group-header");
      if (header) {
        header.className = `group-header flex w-full items-center px-2 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40 hover:text-sidebar-foreground/70 transition-colors duration-150 ${isCollapsed ? "justify-center" : ""}`;
      }

      // Items
      groupEl.querySelectorAll(".sidebar-link").forEach((el) => {
        const page = el.dataset.page;
        const hasActive = el.classList.contains("bg-primary");
        const label = el.querySelector("span:last-child")?.textContent || "";

        el.className = `sidebar-link group flex w-full items-center rounded-lg text-sm transition-all duration-150 ${isCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-2 space-x-3"} ${hasActive ? "bg-primary/10 text-primary font-semibold border-r-2 border-primary" : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"}`;

        // Toggle text visibility
        const textSpan = el.querySelector("span:last-child");
        if (textSpan) textSpan.classList.toggle("hidden", isCollapsed);

        // Toggle tooltip
        if (isCollapsed && label) {
          el.setAttribute("title", label.trim());
        } else {
          el.removeAttribute("title");
        }
      });
    });

    // Footer
    const footerVersion = sidebar.querySelector(".text-center.mt-1");
    if (footerVersion) footerVersion.classList.toggle("hidden", isCollapsed);
  },

  /**
   * Alterna abertura de um sub-menu
   */
  toggleGroup(groupId) {
    if (this._collapsed) return;

    this._openGroups[groupId] = !this._openGroups[groupId];
    Storage.set(`sidebar_group_${groupId}`, this._openGroups[groupId]);

    const groupEl = document.querySelector(`.sidebar-group[data-group="${groupId}"]`);
    if (!groupEl) return;

    const content = groupEl.querySelector(".sidebar-group-content");
    const chevron = groupEl.querySelector(".group-header svg:last-child");
    const isOpen = this._openGroups[groupId];

    if (content) {
      content.classList.toggle("max-h-96", isOpen);
      content.classList.toggle("opacity-100", isOpen);
      content.classList.toggle("max-h-0", !isOpen);
      content.classList.toggle("opacity-0", !isOpen);
    }

    if (chevron) {
      chevron.classList.toggle("rotate-0", isOpen);
      chevron.classList.toggle("-rotate-90", !isOpen);
    }
  },

  /**
   * Atualiza o item ativo na sidebar via data-page
   */
  updateActive(page) {
    document.querySelectorAll(".sidebar-link").forEach((link) => {
      const isActive = link.dataset.page === page;
      link.classList.toggle("bg-primary/10", isActive);
      link.classList.toggle("text-primary", isActive);
      link.classList.toggle("font-semibold", isActive);
      link.classList.toggle("border-r-2", isActive);
      link.classList.toggle("border-primary", isActive);
      link.classList.toggle("text-sidebar-foreground/60", !isActive);
      link.classList.toggle("hover:text-sidebar-foreground", !isActive);
      link.classList.toggle("hover:bg-sidebar-accent", !isActive);

      // Ícone dentro do link ativo
      const icon = link.querySelector("span:first-child");
      if (icon) icon.classList.toggle("text-primary", isActive);
    });
  },
};

// Inicializa automaticamente
Sidebar.init();
