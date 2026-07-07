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

    user: {
      id: "",
      name: "",
      email: "",
      role: "",
    },

    // ── Navigation ────────────────────────────────────
    currentView: "dashboard",
    navLinks: [
      { name: "Dashboard", view: "dashboard", icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>' },
      { name: "Cargas", view: "loads", icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>' },
      { name: "Rotas", view: "routes", icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>' },
      { name: "Veículos", view: "vehicles", icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>' },
      { name: "Matching", view: "matching", icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>' },
      { name: "Chat", view: "chat", icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>' },
      { name: "Notificações", view: "notifications", icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>' },
      { name: "Perfil", view: "profile", icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>' },
    ],

    // ── Data ──────────────────────────────────────────
    loading: false,
    loads: [],
    routes: [],
    vehicles: [],
    matches: [],
    matchesForDriver: [],
    driversForLoad: [],
    notifications: [],
    recentMatches: [],

    stats: {
      activeLoads: 0,
      activeRoutes: 0,
      matches: 0,
      notifications: 0,
    },

    // ── Forms ─────────────────────────────────────────
    formError: "",
    showModal: "",
    toast: { show: false, message: "", type: "success" },

    companyForm: { name: "", document: "", address: "", city: "", state: "", phone: "" },
    driverForm: { name: "", document: "", cnh: "", phone: "", city: "", state: "" },
    loadForm: { title: "", description: "", originCity: "", originState: "", destinationCity: "", destinationState: "", weightKg: "", volumeM3: "", type: "", pickupDate: "", deliveryDate: "" },
    routeForm: { originCity: "", originState: "", destinationCity: "", destinationState: "", departureDate: "", arrivalDate: "", availableWeight: "", availableVolume: "", isReturn: false },
    vehicleForm: { plate: "", model: "", year: "", type: "", capacityKg: "", capacityM3: "" },

    // ── Profile ──────────────────────────────────────
    profileData: null,
    profileEditMode: false,
    profileEditForm: {},

    // ── Matching ──────────────────────────────────────
    selectedLoadForMatching: "",

    // ── Chat ──────────────────────────────────────────
    chatMatches: [],
    selectedChatMatchId: "",
    chatMessages: [],
    chatInput: "",
    chatWs: null,

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

    // ── API Helper ────────────────────────────────────
    async api(path, options = {}) {
      const res = await fetch(`${this.apiUrl}${path}`, {
        headers: this.headers,
        ...options,
      });
      if (!res.ok) {
        let err;
        try { err = await res.json(); } catch { err = { message: `Erro ${res.status}` }; }
        throw new Error(err.message || err.error || `Erro ${res.status}`);
      }
      if (res.status === 204) return null;
      return res.json();
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
        this.user = data.user;
        await this.afterLogin();
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
        this.user = data.user;
        await this.afterLogin();
      } catch (err) {
        this.auth.error = err.message;
      }
    },

    logout() {
      this.auth.token = "";
      localStorage.removeItem("opencargo_token");
      this.user = { id: "", name: "", email: "", role: "" };
      this.loads = [];
      this.routes = [];
      this.vehicles = [];
      this.matches = [];
      this.matchesForDriver = [];
      this.driversForLoad = [];
      this.notifications = [];
      this.recentMatches = [];
      this.currentView = "dashboard";
      if (this.chatWs) {
        this.chatWs.close();
        this.chatWs = null;
      }
    },

    async afterLogin() {
      // Verifica se precisa configurar perfil
      try {
        const profileRes = await fetch(`${this.apiUrl}/auth/me`, { headers: this.headers });
        if (profileRes.ok) {
          const userData = await profileRes.json();
          this.user = { id: userData.id, name: userData.name, email: userData.email, role: userData.role };
        }
      } catch (e) { /* ignore */ }

      // Verifica se empresa/motorista já está cadastrado
      const hasProfile = await this.checkProfile();
      if (!hasProfile) {
        this.currentView = "setup";
        return;
      }

      this.currentView = "dashboard";
      await this.loadAllData();
    },

    async checkProfile() {
      try {
        if (this.user.role === "company") {
          const companies = await this.api("/companies");
          if (companies.length === 0) return false;
          this.companyData = companies[0];
          return true;
        } else if (this.user.role === "driver") {
          const drivers = await this.api("/drivers");
          if (drivers.length === 0) return false;
          this.driverData = drivers[0];
          return true;
        }
        return true;
      } catch {
        return false;
      }
    },

    // ── Profile Setup ────────────────────────────────
    async createCompany() {
      this.formError = "";
      try {
        await this.api("/companies", {
          method: "POST",
          body: JSON.stringify(this.companyForm),
        });
        this.currentView = "dashboard";
        await this.loadAllData();
      } catch (err) {
        this.formError = err.message;
      }
    },

    async createDriver() {
      this.formError = "";
      try {
        await this.api("/drivers", {
          method: "POST",
          body: JSON.stringify(this.driverForm),
        });
        this.currentView = "dashboard";
        await this.loadAllData();
      } catch (err) {
        this.formError = err.message;
      }
    },

    // ── Data Loading ──────────────────────────────────
    async loadAllData() {
      this.loading = true;
      try {
        await Promise.all([
          this.loadLoads(),
          this.loadRoutes(),
          this.loadVehicles(),
          this.loadMatches(),
          this.loadNotifications(),
          this.loadChatMatches(),
        ]);
        this.updateStats();
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      }
      this.loading = false;
    },

    // ── Toast ────────────────────────────────────────
    showToast(message, type = "success") {
      this.toast = { show: true, message, type };
      setTimeout(() => { this.toast.show = false; }, 3500);
    },

    loadViewData(view) {
      if (view === "matching") {
        if (this.user.role === "driver") this.loadMatchesForDriver();
        this.loadMatches();
      }
      if (view === "chat") this.loadChatMatches();
      if (view === "notifications") this.loadNotifications();
      if (view === "profile") this.loadProfile();
    },

    updateStats() {
      this.stats.activeLoads = this.loads.filter((l) => l.status === "available" || l.status === "pending").length;
      this.stats.activeRoutes = this.routes.filter((r) => r.status === "active").length;
      this.stats.matches = this.matches.length;
      this.stats.notifications = this.notifications.filter((n) => !n.read).length;
    },

    async loadLoads() {
      try {
        this.loads = await this.api("/loads");
      } catch { this.loads = []; }
    },

    async loadRoutes() {
      try {
        this.routes = await this.api("/routes");
      } catch { this.routes = []; }
    },

    async loadVehicles() {
      try {
        this.vehicles = await this.api("/vehicles");
      } catch { this.vehicles = []; }
    },

    async loadMatches() {
      try {
        this.matches = await this.api("/matching");
        this.recentMatches = [];
        // Busca dados das cargas para os matches recentes
        const matchPromises = this.matches.slice(0, 5).map(async (m) => {
          try {
            const load = await this.api(`/loads/${m.load_id}`);
            return { match: m, load };
          } catch { return { match: m, load: null }; }
        });
        this.recentMatches = await Promise.all(matchPromises);
      } catch { this.matches = []; this.recentMatches = []; }
    },

    async loadMatchesForDriver() {
      // Busca o driver logado
      try {
        const drivers = await this.api("/drivers");
        if (drivers.length > 0) {
          const driver = drivers[0];
          this.matchesForDriver = await this.api(`/matching/loads-for-driver/${driver.id}`);
        }
      } catch { this.matchesForDriver = []; }
    },

    async loadDriversForLoad() {
      if (!this.selectedLoadForMatching) {
        this.driversForLoad = [];
        return;
      }
      try {
        this.driversForLoad = await this.api(`/matching/drivers-for-load/${this.selectedLoadForMatching}`);
      } catch { this.driversForLoad = []; }
    },

    // ── Notifications ─────────────────────────────────
    async loadNotifications() {
      try {
        this.notifications = await this.api("/notifications");
      } catch { this.notifications = []; }
    },

    async readNotification(id) {
      try {
        await this.api(`/notifications/${id}/read`, { method: "PATCH" });
        await this.loadNotifications();
        this.updateStats();
      } catch (err) { console.error(err); }
    },

    async readAllNotifications() {
      try {
        await this.api("/notifications/read-all", { method: "POST" });
        await this.loadNotifications();
        this.updateStats();
      } catch (err) { console.error(err); }
    },

    // ── Loads ─────────────────────────────────────────
    async createLoad() {
      try {
        const body = {
          title: this.loadForm.title,
          description: this.loadForm.description || undefined,
          originCity: this.loadForm.originCity,
          originState: this.loadForm.originState,
          destinationCity: this.loadForm.destinationCity,
          destinationState: this.loadForm.destinationState,
          weightKg: Number(this.loadForm.weightKg),
          volumeM3: this.loadForm.volumeM3 ? Number(this.loadForm.volumeM3) : undefined,
          type: this.loadForm.type || undefined,
          pickupDate: this.loadForm.pickupDate,
          deliveryDate: this.loadForm.deliveryDate,
        };
        await this.api("/loads", { method: "POST", body: JSON.stringify(body) });
        this.closeModal();
        this.resetForm("loadForm");
        await this.loadLoads();
        this.updateStats();
      } catch (err) { alert(err.message); }
    },

    async updateLoadStatus(id, status) {
      try {
        await this.api(`/loads/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
        await this.loadLoads();
        this.updateStats();
      } catch (err) { alert(err.message); }
    },

    // ── Routes ────────────────────────────────────────
    async createRoute() {
      try {
        const body = {
          originCity: this.routeForm.originCity,
          originState: this.routeForm.originState,
          destinationCity: this.routeForm.destinationCity,
          destinationState: this.routeForm.destinationState,
          departureDate: this.routeForm.departureDate,
          arrivalDate: this.routeForm.arrivalDate,
          availableWeight: this.routeForm.availableWeight ? Number(this.routeForm.availableWeight) : undefined,
          availableVolume: this.routeForm.availableVolume ? Number(this.routeForm.availableVolume) : undefined,
          isReturn: this.routeForm.isReturn,
        };
        await this.api("/routes", { method: "POST", body: JSON.stringify(body) });
        this.closeModal();
        this.resetForm("routeForm");
        await this.loadRoutes();
        this.updateStats();
      } catch (err) { alert(err.message); }
    },

    // ── Vehicles ──────────────────────────────────────
    async createVehicle() {
      try {
        const body = {
          plate: this.vehicleForm.plate,
          model: this.vehicleForm.model,
          year: this.vehicleForm.year ? Number(this.vehicleForm.year) : undefined,
          type: this.vehicleForm.type || undefined,
          capacityKg: Number(this.vehicleForm.capacityKg),
          capacityM3: Number(this.vehicleForm.capacityM3),
        };
        await this.api("/vehicles", { method: "POST", body: JSON.stringify(body) });
        this.closeModal();
        this.resetForm("vehicleForm");
        await this.loadVehicles();
      } catch (err) { alert(err.message); }
    },

    async deleteVehicle(id) {
      if (!confirm("Remover este veículo?")) return;
      try {
        await this.api(`/vehicles/${id}`, { method: "DELETE" });
        await this.loadVehicles();
      } catch (err) { alert(err.message); }
    },

    // ── Matching ──────────────────────────────────────
    async createMatch(loadId, driverId, routeId) {
      try {
        await this.api("/matching", {
          method: "POST",
          body: JSON.stringify({ loadId, driverId, routeId }),
        });
        alert("✅ Match criado com sucesso!");
        await this.loadMatches();
        this.selectedLoadForMatching = "";
        this.driversForLoad = [];
      } catch (err) { alert(err.message); }
    },

    async updateMatchStatus(id, status) {
      try {
        await this.api(`/matching/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
        await this.loadMatches();
      } catch (err) { alert(err.message); }
    },

    // ── Profile ───────────────────────────────────────
    async loadProfile() {
      try {
        const isCompany = this.user.role === "company";
        if (isCompany) {
          this.profileData = await this.api("/companies/me");
        } else if (this.user.role === "driver") {
          this.profileData = await this.api("/drivers/me");
        }
        this.profileEditMode = false;
      } catch {
        this.profileData = null;
      }
    },

    toggleProfileEdit() {
      if (this.profileEditMode) {
        this.profileEditMode = false;
        return;
      }
      this.profileEditForm = { ...this.profileData };
      this.profileEditMode = true;
    },

    async updateProfile() {
      try {
        const isCompany = this.user.role === "company";
        const endpoint = isCompany ? "/companies" : "/drivers";
        const id = this.profileData.id;

        const fieldMap = {
          name: "name",
          document: "document",
          address: "address",
          city: "city",
          state: "state",
          phone: "phone",
          cnh: "cnh",
        };
        const body = {};
        for (const [key, apiKey] of Object.entries(fieldMap)) {
          if (this.profileEditForm[key] !== undefined && this.profileEditForm[key] !== this.profileData[key]) {
            body[apiKey] = this.profileEditForm[key];
          }
        }

        if (Object.keys(body).length === 0) {
          this.showToast("Nenhum dado alterado.", "info");
          this.profileEditMode = false;
          return;
        }

        this.profileData = await this.api(`${endpoint}/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });

        this.profileEditMode = false;
        this.showToast(isCompany ? "Empresa atualizada com sucesso!" : "Motorista atualizado com sucesso!");
      } catch (err) {
        this.showToast(err.message, "error");
      }
    },

    // ── Chat ──────────────────────────────────────────
    async loadChatMatches() {
      try {
        this.chatMatches = await this.api("/matching");
        // Filtra apenas matches com status aceito ou pendente
        this.chatMatches = this.chatMatches.filter((m) =>
          ["accepted", "pending"].includes(m.status)
        );
      } catch { this.chatMatches = []; }
    },

    async selectChatMatch(matchId) {
      this.selectedChatMatchId = matchId;
      try {
        this.chatMessages = await this.api(`/chat/messages/${matchId}`);
      } catch { this.chatMessages = []; }

      // Rola para o final
      this.$nextTick(() => {
        const container = this.$refs.chatMessages;
        if (container) container.scrollTop = container.scrollHeight;
      });
    },

    async sendMessage() {
      if (!this.chatInput.trim() || !this.selectedChatMatchId) return;
      const content = this.chatInput;
      this.chatInput = "";
      try {
        await this.api("/chat/messages", {
          method: "POST",
          body: JSON.stringify({
            matchId: this.selectedChatMatchId,
            content,
          }),
        });
        // Recarrega mensagens
        this.chatMessages = await this.api(`/chat/messages/${this.selectedChatMatchId}`);
        this.$nextTick(() => {
          const container = this.$refs.chatMessages;
          if (container) container.scrollTop = container.scrollHeight;
        });
      } catch (err) {
        alert(err.message);
        this.chatInput = content;
      }
    },

    // ── Modal ─────────────────────────────────────────
    openModal(type) {
      this.showModal = type;
      this.resetForm(type + "Form");
    },

    closeModal() {
      this.showModal = "";
    },

    resetForm(name) {
      const defaults = {
        loadForm: { title: "", description: "", originCity: "", originState: "", destinationCity: "", destinationState: "", weightKg: "", volumeM3: "", type: "", pickupDate: "", deliveryDate: "" },
        routeForm: { originCity: "", originState: "", destinationCity: "", destinationState: "", departureDate: "", arrivalDate: "", availableWeight: "", availableVolume: "", isReturn: false },
        vehicleForm: { plate: "", model: "", year: "", type: "", capacityKg: "", capacityM3: "" },
      };
      if (defaults[name]) Object.assign(this[name], defaults[name]);
    },

    // ── Utils ─────────────────────────────────────────
    formatDate(dateStr) {
      if (!dateStr) return "";
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return dateStr;
      }
    },

    // ── Init ──────────────────────────────────────────
    async init() {
      if (this.auth.token) {
        try {
          // Decodifica o JWT (base64url → base64) para obter dados do usuário
          const payload = this.auth.token.split(".")[1];
          const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
          const decoded = JSON.parse(atob(base64));
          this.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            name: decoded.name || decoded.email,
          };
          await this.afterLogin();
        } catch (e) {
          console.error("Erro ao restaurar sessão:", e);
          this.logout();
        }
      }
    },
  };
}

// Torna o app global para o Alpine.js
window.app = app;
