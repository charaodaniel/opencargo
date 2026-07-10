/**
 * ── OpenCargo — Audit Page ────────────────────────────
 * Estatísticas avançadas de auditoria:
 * - Top usuários por atividade
 * - Horários de pico (distribuição horária)
 * - Dias da semana mais movimentados
 * - Breakdown ação × entidade
 * - Últimas 24h em tempo real
 *
 * Apenas administradores têm acesso.
 */

const AuditPage = {
  /** Dados da API */
  _data: null,

  /** Período selecionado */
  _period: 30,

  /** Instâncias de gráficos */
  _chartHour: null,
  _chartWeekday: null,
  _chartEntity: null,
  _last24hChart: null,

  async render() {
    const user = Storage.getUser();
    if (!user || user.role !== "administrador") {
      return `<div class="text-center py-16 text-gray-500">Acesso restrito a administradores.</div>`;
    }

    await this._fetchAudit();

    return `
      <div class="fade-in">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              <span>Auditoria</span>
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Estatísticas avançadas de atividade na plataforma</p>
          </div>
          <!-- Period Toggle -->
          <div class="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            ${[7, 15, 30, 90].map(d => `
              <button onclick="AuditPage.setPeriod(${d})"
                class="px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  this._period === d
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }">${d}d</button>
            `).join("")}
          </div>
        </div>

        ${this._data ? `
          <!-- Stats Overview Cards -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <p class="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Ações (período)</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">${Utils.formatNumber(this._data.period_total)}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <p class="text-xs text-gray-500 uppercase tracking-wider font-medium">Usuários Ativos</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">${this._data.top_users.length}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <p class="text-xs text-gray-500 uppercase tracking-wider font-medium">Pico (hora)</p>
              <p class="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                ${(() => {
                  const peak = (this._data.by_hour || []).reduce((max, h) => (h.count > (max?.count || 0) ? h : max), null);
                  return peak ? `${peak.hour}h` : "—";
                })()}
              </p>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <p class="text-xs text-gray-500 uppercase tracking-wider font-medium">Dia + Ativo</p>
              <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                ${(() => {
                  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
                  const peak = (this._data.by_weekday || []).reduce((max, d) => (d.count > (max?.count || 0) ? d : max), null);
                  return peak ? weekdays[peak.weekday] || "—" : "—";
                })()}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <!-- Peak Hours Chart -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                <svg class="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>Horários de Pico (${this._period}d)</span>
              </h3>
              <div class="relative" style="height: 180px;">
                <canvas id="chart-audit-hours"></canvas>
              </div>
            </div>

            <!-- Weekday Chart -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/>
                </svg>
                <span>Atividade por Dia da Semana (${this._period}d)</span>
              </h3>
              <div class="relative" style="height: 180px;">
                <canvas id="chart-audit-weekday"></canvas>
              </div>
            </div>
          </div>

          <!-- Top Users -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/>
                </svg>
                <span>Top Usuários (${this._period}d)</span>
              </h3>
              <div class="space-y-1 max-h-80 overflow-y-auto pr-1">
                ${(this._data.top_users || []).map((u, i) => {
                  const pct = this._data.period_total > 0 ? Math.round((u.count / this._data.period_total) * 100) : 0;
                  const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
                  return `
                    <div class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div class="flex items-center space-x-3 min-w-0">
                        <span class="text-sm font-mono ${i < 3 ? "text-lg" : "text-gray-400"} shrink-0">${medal}</span>
                        <div class="min-w-0">
                          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">${Utils.escapeHtml(u.user_name || "Sistema")}</p>
                        </div>
                      </div>
                      <div class="flex items-center space-x-3 shrink-0">
                        <div class="w-20 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div class="h-full rounded-full bg-blue-500 transition-all" style="width: ${pct}%"></div>
                        </div>
                        <span class="text-sm font-semibold text-gray-900 dark:text-white w-12 text-right">${Utils.formatNumber(u.count)}</span>
                      </div>
                    </div>
                  `;
                }).join("")}
                ${(!this._data.top_users || this._data.top_users.length === 0) ? `
                  <p class="text-sm text-gray-400 text-center py-4">Nenhum dado disponível</p>
                ` : ""}
              </div>
            </div>

            <!-- Action × Entity Breakdown -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                </svg>
                <span>Breakdown Ação × Entidade (${this._period}d)</span>
              </h3>
              <div class="relative" style="height: 200px;">
                <canvas id="chart-audit-entity"></canvas>
              </div>
            </div>
          </div>

          <!-- Last 24h Activity -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
              <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <span>Últimas 24 Horas (atividade por hora)</span>
            </h3>
            <div class="relative" style="height: 120px;">
              <canvas id="chart-audit-last24h"></canvas>
            </div>
          </div>
        ` : `
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <svg class="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Carregando dados...</h3>
          </div>
        `}
      </div>
    `;
  },

  // ═══ Data fetching ═════════════════════════════════

  /**
   * Busca dados de auditoria da API
   */
  async _fetchAudit() {
    try {
      const token = Storage.getToken();
      const res = await fetch(`${CONFIG.API_BASE_URL}/logs/audit?days=${this._period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        this._data = await res.json();
      } else {
        this._data = null;
        Toast.error("Erro ao carregar dados de auditoria");
      }
    } catch {
      this._data = null;
    }
  },

  // ═══ Actions ═══════════════════════════════════════

  /**
   * Altera o período e recarrega os dados
   */
  async setPeriod(period) {
    this._period = period;
    await this._fetchAudit();
    Router.refresh();
  },

  afterRender() {
    this._initCharts();
  },

  // ═══ Charts ════════════════════════════════════════

  /**
   * Inicializa todos os gráficos da página
   */
  _initCharts() {
    if (!this._data) return;

    this._initHourChart();
    this._initWeekdayChart();
    this._initEntityChart();
    this._initLast24hChart();
  },

  /**
   * Gráfico de distribuição horária (pico)
   */
  _initHourChart() {
    const canvas = document.getElementById("chart-audit-hours");
    if (!canvas) return;

    const hours = this._data.by_hour || [];
    if (hours.length === 0) return;

    const isDark = document.documentElement.classList.contains("dark");
    const textColor = isDark ? "#9ca3af" : "#6b7280";
    const gridColor = isDark ? "#374151" : "#e5e7eb";

    // Preenche todas as 24 horas (0-23)
    const hourMap = {};
    hours.forEach(h => { hourMap[h.hour] = h.count; });
    const labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}h`);
    const data = Array.from({ length: 24 }, (_, i) => hourMap[i] || 0);

    // Encontra o pico para destacar
    const maxVal = Math.max(...data, 1);

    this._chartHour = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Ações",
          data,
          backgroundColor: data.map(v =>
            v === maxVal
              ? "rgba(249, 115, 22, 0.8)"
              : v >= maxVal * 0.7
                ? "rgba(249, 115, 22, 0.5)"
                : "rgba(59, 130, 246, 0.4)"
          ),
          borderColor: data.map(v => v === maxVal ? "#f97316" : "#3b82f6"),
          borderWidth: 1,
          borderRadius: 3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => `${items[0].label}`,
              label: (ctx) => `${ctx.raw} ação(ões)`,
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: textColor,
              maxTicksLimit: 12,
              maxRotation: 0,
            },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: textColor,
              precision: 0,
            },
            grid: { color: gridColor },
          },
        },
      },
    });
  },

  /**
   * Gráfico de atividade por dia da semana
   */
  _initWeekdayChart() {
    const canvas = document.getElementById("chart-audit-weekday");
    if (!canvas) return;

    const weekdays = this._data.by_weekday || [];
    if (weekdays.length === 0) return;

    const isDark = document.documentElement.classList.contains("dark");
    const textColor = isDark ? "#9ca3af" : "#6b7280";
    const gridColor = isDark ? "#374151" : "#e5e7eb";

    const names = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const shortNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    // Preenche todos os 7 dias
    const dayMap = {};
    weekdays.forEach(d => { dayMap[d.weekday] = d.count; });
    const labels = shortNames;
    const data = Array.from({ length: 7 }, (_, i) => dayMap[i] || 0);

    // Cores: dias úteis mais escuros, fim de semana mais claros
    const colors = data.map((v, i) => {
      if (i === 0 || i === 6) return "rgba(168, 85, 247, 0.4)";
      if (v === Math.max(...data)) return "rgba(16, 185, 129, 0.8)";
      return "rgba(16, 185, 129, 0.5)";
    });
    const borders = data.map((v, i) => {
      if (i === 0 || i === 6) return "#a855f7";
      if (v === Math.max(...data)) return "#10b981";
      return "#10b981";
    });

    this._chartWeekday = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Ações",
          data,
          backgroundColor: colors,
          borderColor: borders,
          borderWidth: 1,
          borderRadius: 3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => names[labels.indexOf(items[0].label)] || items[0].label,
              label: (ctx) => `${ctx.raw} ação(ões)`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: textColor, maxRotation: 0 },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: { color: textColor, precision: 0 },
            grid: { color: gridColor },
          },
        },
      },
    });
  },

  /**
   * Gráfico de breakdown ação × entidade
   */
  _initEntityChart() {
    const canvas = document.getElementById("chart-audit-entity");
    if (!canvas) return;

    const rows = this._data.action_entity || [];
    if (rows.length === 0) return;

    const isDark = document.documentElement.classList.contains("dark");
    const textColor = isDark ? "#9ca3af" : "#6b7280";
    const gridColor = isDark ? "#374151" : "#e5e7eb";

    // Agrupa por entidade, mostra action dentro
    const entityMap = {};
    rows.forEach(r => {
      if (!entityMap[r.entity_type]) entityMap[r.entity_type] = {};
      entityMap[r.entity_type][r.action] = (entityMap[r.entity_type][r.action] || 0) + r.count;
    });

    const entities = Object.keys(entityMap).slice(0, 8); // top 8 entidades
    const actions = ["create", "update", "delete", "login"];
    const actionLabels = { create: "Criou", update: "Atualizou", delete: "Excluiu", login: "Login" };
    const actionColors = {
      create: "rgba(34, 197, 94, 0.7)",
      update: "rgba(59, 130, 246, 0.7)",
      delete: "rgba(239, 68, 68, 0.7)",
      login: "rgba(168, 85, 247, 0.7)",
    };

    const datasets = actions.map(action => ({
      label: actionLabels[action] || action,
      data: entities.map(ent => entityMap[ent][action] || 0),
      backgroundColor: actionColors[action] || "rgba(156, 163, 175, 0.7)",
      borderWidth: 0,
      borderRadius: 2,
    }));

    this._chartEntity = new Chart(canvas, {
      type: "bar",
      data: {
        labels: entities,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            display: true,
            position: "bottom",
            labels: {
              color: textColor,
              boxWidth: 10,
              boxHeight: 10,
              padding: 8,
              font: { size: 10 },
              usePointStyle: true,
              pointStyle: "rectRounded",
            },
          },
          tooltip: { mode: "index", intersect: false },
        },
        scales: {
          x: {
            stacked: true,
            ticks: { color: textColor, maxRotation: 0 },
            grid: { display: false },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: { color: textColor, precision: 0 },
            grid: { color: gridColor },
          },
        },
      },
    });
  },

  /**
   * Gráfico das últimas 24h
   */
  _initLast24hChart() {
    const canvas = document.getElementById("chart-audit-last24h");
    if (!canvas) return;

    const hours = this._data.last_24h || [];
    if (hours.length === 0) return;

    const isDark = document.documentElement.classList.contains("dark");
    const textColor = isDark ? "#9ca3af" : "#6b7280";

    // Preenche 24 horas
    const hourMap = {};
    hours.forEach(h => { hourMap[h.hour] = h.count; });
    const labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}h`);
    const data = Array.from({ length: 24 }, (_, i) => hourMap[i] || 0);

    this._last24hChart = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Ações",
          data,
          fill: true,
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          borderColor: "#ef4444",
          borderWidth: 2,
          pointRadius: 2,
          pointBackgroundColor: "#ef4444",
          tension: 0.3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.raw} ação(ões)`,
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: textColor,
              maxTicksLimit: 8,
              maxRotation: 0,
            },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: { color: textColor, precision: 0 },
            grid: { display: false },
          },
        },
      },
    });
  },
};
