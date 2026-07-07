// ── OpenCargo — Alpine.js Application ──────────────────

function app() {
  return {
    // ── Auth ──────────────────────────────────────────
    auth: {
      token: localStorage.getItem("opencargo_token") || "",
      isLogin: true,
      error: "",
      form: {
        name: "",
        email: "",
        password: "",
        role: "driver",
      },
    },

    // ── Navigation ────────────────────────────────────
    currentView: "dashboard",
    navLinks: [
      { name: "Dashboard", view: "dashboard" },
      { name: "Cargas", view: "loads" },
      { name: "Rotas", view: "routes" },
      { name: "Matching", view: "matching" },
    ],

    // ── Data ──────────────────────────────────────────
    loads: [],
    routes: [],
    matchesForDriver: [],
    driversForLoad: [],

    stats: {
      activeLoads: 0,
      activeRoutes: 0,
      matches: 0,
    },

    // ── API Base ──────────────────────────────────────
    get apiUrl() {
      return "http://localhost:3000/api";
    },

    get headers() {
      return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.auth.token}`,
      };
    },

    // ── Auth Methods ──────────────────────────────────
    async login() {
      this.auth.error = "";
      try {
        const res = await fetch(`${this.apiUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: this.auth.form.email,
            password: this.auth.form.password,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Erro ao fazer login");
        }

        const data = await res.json();
        this.auth.token = data.token;
        localStorage.setItem("opencargo_token", data.token);
        this.loadDashboard();
      } catch (err) {
        this.auth.error = err.message;
      }
    },

    async register() {
      this.auth.error = "";
      try {
        const res = await fetch(`${this.apiUrl}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.auth.form),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Erro ao criar conta");
        }

        const data = await res.json();
        this.auth.token = data.token;
        localStorage.setItem("opencargo_token", data.token);
        this.loadDashboard();
      } catch (err) {
        this.auth.error = err.message;
      }
    },

    logout() {
      this.auth.token = "";
      localStorage.removeItem("opencargo_token");
      this.loads = [];
      this.routes = [];
    },

    // ── Data Loading ──────────────────────────────────
    async loadDashboard() {
      await Promise.all([this.loadLoads(), this.loadRoutes()]);
      this.stats.activeLoads = this.loads.filter((l) => l.status === "available").length;
      this.stats.activeRoutes = this.routes.filter((r) => r.status === "active").length;
      this.stats.matches = this.loads.filter((l) => l.status === "matched").length;
    },

    async loadLoads() {
      try {
        const res = await fetch(`${this.apiUrl}/loads`, {
          headers: this.headers,
        });
        if (res.ok) {
          this.loads = await res.json();
        }
      } catch (err) {
        console.error("Erro ao carregar cargas:", err);
      }
    },

    async loadRoutes() {
      try {
        const res = await fetch(`${this.apiUrl}/routes`, {
          headers: this.headers,
        });
        if (res.ok) {
          this.routes = await res.json();
        }
      } catch (err) {
        console.error("Erro ao carregar rotas:", err);
      }
    },

    async loadMatches() {
      try {
        const [loadsRes, routesRes] = await Promise.all([
          fetch(`${this.apiUrl}/matching/drivers-for-load`, { headers: this.headers }),
          fetch(`${this.apiUrl}/matching/loads-for-driver`, { headers: this.headers }),
        ]);

        if (loadsRes.ok) this.driversForLoad = await loadsRes.json();
        if (routesRes.ok) this.matchesForDriver = await routesRes.json();
      } catch (err) {
        console.error("Erro ao carregar matches:", err);
      }
    },

    // ── Init ──────────────────────────────────────────
    init() {
      if (this.auth.token) {
        this.loadDashboard();
        this.loadMatches();
      }
    },
  };
}

// Torna o app global para o Alpine.js
window.app = app;
