/**
 * ── OpenCargo — Dashboard Page ────────────────────────
 * Página principal com cards de estatísticas, ações
 * rápidas, últimas atividades e gráficos Chart.js.
 */

const DashboardPage = {
  /** Dados para os gráficos */
  _chartData: null,

  /** Instâncias dos charts para destruir ao recarregar */
  _charts: [],

  /**
   * Renderiza a página de dashboard
   * @returns {string} HTML completo da página
   */
  async render() {
    // Carrega dados em paralelo
    const [companies, drivers, loads, routes] = await Promise.all([
      Api.get("companies"),
      Api.get("drivers"),
      Api.get("loads"),
      Api.get("routes"),
    ]);

    // Tenta carregar users para o gráfico de distribuição
    let users = [];
    try {
      const token = Storage.getToken();
      const res = await fetch(`${CONFIG.API_BASE_URL}/users/admin/all?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        users = json.data || [];
      }
    } catch {}

    // Tenta carregar matches
    let matches = [];
    try {
      const matchData = await Api.get("matching");
      matches = Array.isArray(matchData) ? matchData : (matchData?.data || []);
    } catch {}

    const activeLoads = loads.filter((l) => l.status === "available").length;
    const activeRoutes = routes.filter((r) => r.status === "active").length;
    const totalCompanies = companies.filter((c) => c.active).length;
    const availableDrivers = drivers.filter((d) => d.available).length;
    const pendingMatches = matches.filter((m) => m.status === "pending").length;
    const deliveredLoads = loads.filter((l) => l.status === "delivered").length;

    // Guarda dados para o afterRender
    this._chartData = { loads, users };

    const stats = [
      { title: __("dashboard.activeCompanies"), value: totalCompanies, icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>' },
      { title: __("dashboard.availableDrivers"), value: availableDrivers, color: "green", icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>' },
      { title: __("dashboard.availableLoads"), value: activeLoads, color: "purple", icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>' },
      { title: __("dashboard.activeRoutes"), value: activeRoutes, color: "amber", icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>' },
      { title: __("dashboard.pendingMatches"), value: pendingMatches, color: "red", icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>' },
      { title: __("dashboard.deliveredLoads"), value: deliveredLoads, color: "green", icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' },
    ];

    return `
      <div class="fade-in">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">${__("page.dashboard")}</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">${__("page.dashboard.desc")}</p>
          </div>
          <span class="text-sm text-gray-400">${Utils.formatDate(new Date().toISOString(), true)}</span>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          ${stats.map((s) => Card.stat(s)).join("")}
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div class="glass-card rounded-xl p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status das Cargas</h3>
            <div class="relative" style="height: 260px;">
              <canvas id="chart-loads-status"></canvas>
            </div>
          </div>
          <div class="glass-card rounded-xl p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribuição de Usuários</h3>
            <div class="relative" style="height: 260px;">
              <canvas id="chart-users-role"></canvas>
            </div>
          </div>
        </div>

        <!-- Quick Actions + Recent Activity -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          ${this._quickActions()}
          ${this._recentActivity(matches, loads)}
        </div>
      </div>
    `;
  },

  /**
   * Inicializa os gráficos após o render
   */
  afterRender() {
    this._initCharts();
  },

  /**
   * Inicializa todos os gráficos
   */
  _initCharts() {
    const data = this._chartData;
    if (!data) return;

    // Destrói charts anteriores
    this._charts.forEach(c => c.destroy());
    this._charts = [];

    this._chartLoadsStatus(data.loads);
    this._chartUsersRole(data.users);
  },

  /**
   * Gráfico de barras: status das cargas
   */
  _chartLoadsStatus(loads) {
    const canvas = document.getElementById("chart-loads-status");
    if (!canvas) return;

    const isDark = document.documentElement.classList.contains("dark");
    const textColor = isDark ? "#9ca3af" : "#6b7280";
    const gridColor = isDark ? "#374151" : "#e5e7eb";

    const statusOrder = ["pending", "available", "matched", "in_transit", "delivered", "cancelled"];
    const statusLabels = {
      pending: "Pendente", available: "Disponível", matched: "Compatível",
      in_transit: "Em Trânsito", delivered: "Entregue", cancelled: "Cancelado",
    };
    const statusColors = {
      pending: "#f59e0b", available: "#3b82f6", matched: "#8b5cf6",
      in_transit: "#06b6d4", delivered: "#10b981", cancelled: "#ef4444",
    };

    const labels = statusOrder.map(s => statusLabels[s]);
    const data = statusOrder.map(s => loads.filter(l => l.status === s).length);
    const colors = statusOrder.map(s => statusColors[s]);

    if (data.every(v => v === 0)) {
      canvas.parentElement.innerHTML = `<div class="flex items-center justify-center h-full text-gray-400 text-sm">Nenhuma carga cadastrada</div>`;
      return;
    }

    const chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Cargas",
          data,
          backgroundColor: colors.map(c => c + "80"),
          borderColor: colors,
          borderWidth: 2,
          borderRadius: 6,
          barPercentage: 0.65,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: textColor, stepSize: 1 },
            grid: { color: gridColor },
          },
          x: {
            ticks: { color: textColor },
            grid: { display: false },
          },
        },
      },
    });
    this._charts.push(chart);
  },

  /**
   * Gráfico doughnut: distribuição de usuários por role
   */
  _chartUsersRole(users) {
    const canvas = document.getElementById("chart-users-role");
    if (!canvas) return;

    const isDark = document.documentElement.classList.contains("dark");
    const textColor = isDark ? "#d1d5db" : "#374151";

    const roles = ["administrador", "gestor", "empresa", "motorista"];
    const roleLabels = { administrador: "Administradores", gestor: "Gestores", empresa: "Empresas", motorista: "Motoristas" };
    const roleColors = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"];

    const data = roles.map(r => users.filter(u => u.role === r).length);

    if (data.every(v => v === 0)) {
      canvas.parentElement.innerHTML = `<div class="flex items-center justify-center h-full text-gray-400 text-sm">Nenhum dado disponível</div>`;
      return;
    }

    const chart = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: roles.map(r => roleLabels[r]),
        datasets: [{
          data,
          backgroundColor: roleColors,
          borderWidth: 0,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "65%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: textColor,
              padding: 16,
              usePointStyle: true,
              pointStyle: "circle",
              font: { size: 12 },
            },
          },
        },
      },
    });
    this._charts.push(chart);
  },

  /**
   * Renderiza ações rápidas
   */
  _quickActions() {
    const actions = [
      { icon: Icons.package({ class: 'w-5 h-5 shrink-0 icon-lift' }), title: __("dashboard.newLoad"), desc: __("dashboard.newLoad.desc"), page: "loads" },
      { icon: Icons.route({ class: 'w-5 h-5 shrink-0 icon-rotate' }), title: __("dashboard.newRoute"), desc: __("dashboard.newRoute.desc"), page: "routes" },
      { icon: Icons.link({ class: 'w-5 h-5 shrink-0 icon-scale' }), title: __("dashboard.viewMatching"), desc: __("dashboard.viewMatching.desc"), page: "matching" },
      { icon: Icons.chat({ class: 'w-5 h-5 shrink-0 icon-pulse', noHover: true }), title: __("nav.chat"), desc: __("dashboard.chat.desc"), page: "chat" },
    ];

    return `
      <div class="glass-card rounded-xl p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">${__("dashboard.quickActions")}</h3>
        <div class="space-y-3">
          ${actions
            .map(
              (a) => `
            <button onclick="Router.go('${a.page}')" class="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
              <p class="font-medium text-gray-900 dark:text-white flex items-center space-x-2">${a.icon}<span>${a.title}</span></p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">${a.desc}</p>
            </button>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  },

  /**
   * Renderiza atividade recente
   */
  _recentActivity(matches, loads) {
    const recentItems = matches.slice(0, 5).map((m) => {
      const load = loads.find((l) => l.id === m.load_id);
      const driverName = m.driver_name || m.driver?.name || (m.driver_id ? `Motorista #${m.driver_id.slice(0, 8)}` : "Motorista");
      const loadTitle = load ? load.title : (m.load_title || `Carga #${m.load_id ? m.load_id.slice(0, 8) : ""}`);
      return {
        type: "match",
        description: `Match: ${loadTitle}`,
        subtitle: `${driverName} - ${Utils.getStatusLabel(m.status)}`,
        status: m.status,
      };
    });

    if (recentItems.length === 0) {
      return `
        <div class="glass-card rounded-xl p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">${__("dashboard.recentActivity")}</h3>
        <div class="text-center py-12 text-gray-400">
            <p class="text-lg font-medium">${__("dashboard.noActivity")}</p>
            <p class="text-sm">${__("dashboard.startActivity")}</p>
          </div>
        </div>
      `;
    }

    return `
      <div class="glass-card rounded-xl p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">${__("dashboard.recentActivity")}</h3>
        <div class="space-y-3">
          ${recentItems
            .map(
              (item) => `
            <div class="flex items-center justify-between py-2">
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">${item.description}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">${item.subtitle}</p>
              </div>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${Utils.getStatusClass(item.status)}">
                ${Utils.getStatusLabel(item.status)}
              </span>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  },
};
