/**
 * ── OpenCargo — Maps Page ─────────────────────────────
 * Visualização de rotas e cargas no mapa com Leaflet + OpenStreetMap.
 *
 * Funcionalidades:
 * - Marcadores para todas as cidades do sistema
 * - Polylines de rotas com cores por status
 * - Carregamento assíncrono de geometria via OSRM (com fallback)
 * - Filtros por tipo (rotas ativas, concluídas, cargas, cidades)
 * - Popups com detalhes ao clicar
 * - Suporte a dark mode
 * - Legenda interativa
 */

const MapsPage = {
  /** Instância do mapa Leaflet */
  _map: null,

  /** Grupos de camadas separados por tipo (para toggle seguro) */
  _groups: {
    activeRoutes: null,   // L.featureGroup para rotas ativas
    completedRoutes: null, // L.featureGroup para rotas concluídas
    cancelledRoutes: null, // L.featureGroup para rotas canceladas
    loads: null,          // L.featureGroup para cargas
    cities: null,         // L.featureGroup para cidades
  },

  /** Cache de geometria OSRM */
  _routeCache: {},

  /** Dados carregados */
  _routes: [],
  _loads: [],

  /** Estado dos filtros */
  _filters: {
    active: true,
    completed: false,
    loads: true,
    cities: true,
  },

  /** Parâmetros recebidos na navegação */
  _params: {},

  /** Promessa de inicialização (evita múltiplas chamadas) */
  _initPromise: null,

  // ── Coordenadas das cidades brasileiras ──────────────
  _CITIES: {
    "São Paulo/SP": { lat: -23.5505, lng: -46.6333, state: "SP" },
    "Porto Alegre/RS": { lat: -30.0346, lng: -51.2177, state: "RS" },
    "Rio de Janeiro/RJ": { lat: -22.9068, lng: -43.1729, state: "RJ" },
    "Belo Horizonte/MG": { lat: -19.9167, lng: -43.9345, state: "MG" },
    "Curitiba/PR": { lat: -25.429, lng: -49.2671, state: "PR" },
    "Florianópolis/SC": { lat: -27.5945, lng: -48.5477, state: "SC" },
    "Campinas/SP": { lat: -22.9099, lng: -47.0626, state: "SP" },
    "Salvador/BA": { lat: -12.9714, lng: -38.5014, state: "BA" },
    "Fortaleza/CE": { lat: -3.7319, lng: -38.5267, state: "CE" },
    "Recife/PE": { lat: -8.0476, lng: -34.877, state: "PE" },
    "Brasília/DF": { lat: -15.7975, lng: -47.8919, state: "DF" },
    "Manaus/AM": { lat: -3.119, lng: -60.0217, state: "AM" },
    "Goiânia/GO": { lat: -16.6864, lng: -49.2643, state: "GO" },
    "Vitória/ES": { lat: -20.2976, lng: -40.2958, state: "ES" },
    "São Luís/MA": { lat: -2.5387, lng: -44.2822, state: "MA" },
    "Natal/RN": { lat: -5.7793, lng: -35.2009, state: "RN" },
    "João Pessoa/PB": { lat: -7.115, lng: -34.8641, state: "PB" },
    "Maceió/AL": { lat: -9.6498, lng: -35.7089, state: "AL" },
    "Aracaju/SE": { lat: -10.9095, lng: -37.0678, state: "SE" },
    "Cuiabá/MT": { lat: -15.601, lng: -56.0974, state: "MT" },
    "Campo Grande/MS": { lat: -20.4697, lng: -54.6201, state: "MS" },
    "Belém/PA": { lat: -1.4558, lng: -48.5036, state: "PA" },
  },

  /**
   * Obtém coordenadas de uma cidade pelo nome + estado
   */
  _getCoords(city, state) {
    const key = `${city}/${state}`;
    if (this._CITIES[key]) return this._CITIES[key];
    for (const [k, v] of Object.entries(this._CITIES)) {
      if (k.startsWith(city) || k.includes(city)) return v;
    }
    return null;
  },

  // ── Render ───────────────────────────────────────────

  async render(params = {}) {
    this._params = params;
    const [routes, loads] = await Promise.all([
      Api.get("routes"),
      Api.get("loads"),
    ]);

    this._routes = routes;
    this._loads = loads;

    const citiesSet = new Set();
    routes.forEach((r) => {
      citiesSet.add(`${r.origin_city}/${r.origin_state}`);
      citiesSet.add(`${r.destination_city}/${r.destination_state}`);
    });
    loads.forEach((l) => {
      citiesSet.add(`${l.origin_city}/${l.origin_state}`);
      citiesSet.add(`${l.destination_city}/${l.destination_state}`);
    });

    return `
      <div class="fade-in">
        <div class="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">${Icons.map({ class: 'w-6 h-6 inline -mt-1 mr-1' })} Mapa de Rotas</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Visualize rotas, cargas e cidades no mapa</p>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <!-- Busca de cidade -->
            <div class="w-64" id="map-search-wrapper"></div>
            <!-- Filtros rápidos -->
            <div class="flex flex-wrap gap-2" id="map-filters">
            <label class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              this._filters.active ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
            }">
              <input type="checkbox" class="sr-only" data-filter="active" ${this._filters.active ? "checked" : ""}>
              <span class="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
              Rotas Ativas
            </label>
            <label class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              this._filters.completed ? "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300" : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
            }">
              <input type="checkbox" class="sr-only" data-filter="completed" ${this._filters.completed ? "checked" : ""}>
              <span class="w-2 h-2 rounded-full bg-gray-400 mr-1.5"></span>
              Concluídas
            </label>
            <label class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              this._filters.loads ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
            }">
              <input type="checkbox" class="sr-only" data-filter="loads" ${this._filters.loads ? "checked" : ""}>
              <span class="w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span>
              Cargas
            </label>
            <label class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              this._filters.cities ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
            }">
              <input type="checkbox" class="sr-only" data-filter="cities" ${this._filters.cities ? "checked" : ""}>
              Cidades
            </label>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <!-- Mapa -->
          <div class="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden" style="height: 600px;">
            <div id="map-container" class="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <div class="text-center text-gray-400" id="map-loading">
                <svg class="w-12 h-12 animate-spin mx-auto mb-3 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <p class="text-sm font-medium">Carregando mapa...</p>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="space-y-4" id="map-sidebar">
            <!-- Legenda -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"/></svg>
                Legenda
              </h3>
              <div class="space-y-2 text-xs">
                <div class="flex items-center"><span class="w-6 h-0.5 bg-blue-500 mr-2"></span> Rota Ativa</div>
                <div class="flex items-center"><span class="w-6 h-0.5 bg-gray-400 mr-2"></span> Rota Concluída</div>
                <div class="flex items-center"><span class="w-6 h-0.5 bg-red-400 mr-2"></span> Rota Cancelada</div>
                <div class="flex items-center"><span class="w-6 h-0.5 border-t-2 border-dashed border-blue-400 mr-2"></span> Retorno (Backhaul)</div>
                <div class="flex items-center mt-2"><span class="w-3 h-3 rounded-full bg-blue-600 mr-2"></span> Origem</div>
                <div class="flex items-center"><span class="w-3 h-3 rounded-full bg-red-600 mr-2"></span> Destino</div>
                <div class="flex items-center"><span class="w-3 h-3 rounded-full bg-amber-500 mr-2"></span> Carga</div>
              </div>
            </div>

            <!-- Estatísticas -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                ${Icons.chart({ class: 'w-4 h-4 mr-1.5' })}
                Estatísticas
              </h3>
              <div class="space-y-2 text-sm" id="map-stats">
                <div class="flex justify-between">
                  <span class="text-gray-500">Total Rotas</span>
                  <span class="font-medium text-gray-900 dark:text-white">${routes.length}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Rotas Ativas</span>
                  <span class="font-medium text-green-600">${routes.filter(r => r.status === 'active').length}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Concluídas</span>
                  <span class="font-medium text-gray-600">${routes.filter(r => r.status === 'completed').length}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Retorno</span>
                  <span class="font-medium text-blue-600">${routes.filter(r => r.is_return).length}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Cargas</span>
                  <span class="font-medium text-amber-600">${loads.length}</span>
                </div>
                <div class="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                  <span class="text-gray-500">Cidades</span>
                  <span class="font-medium text-purple-600">${citiesSet.size}</span>
                </div>
              </div>
            </div>

            <!-- Rotas listadas -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 max-h-48 overflow-y-auto" id="map-route-list">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                ${Icons.route({ class: 'w-4 h-4 mr-1.5' })}
                Rotas
              </h3>
              <div class="space-y-2">
                ${routes
                  .map(
                    (r, i) => `
                  <div class="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors route-list-item" data-index="${i}">
                    <div class="flex items-center min-w-0">
                      <span class="w-2 h-2 rounded-full shrink-0 mr-2 ${r.status === 'active' ? 'bg-blue-500' : r.status === 'completed' ? 'bg-gray-400' : 'bg-red-400'}"></span>
                      <span class="text-xs truncate">${r.origin_city} → ${r.destination_city}</span>
                    </div>
                    <span class="text-xs text-gray-400 shrink-0 ml-2">${r.is_return ? Icons.refresh({ class: 'w-3.5 h-3.5 text-blue-500' }) : ''}</span>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * AfterRender — executa após o HTML ser inserido no DOM
   */
  afterRender() {
    // Injeta o autocomplete de busca de cidades
    const searchWrapper = document.getElementById("map-search-wrapper");
    if (searchWrapper) {
      searchWrapper.innerHTML = Geocoding.createAutocomplete({
        placeholder: "Buscar cidade...",
        id: "map-city-search",
        onSelect: (result) => this._flyToCity(result),
      });
      Geocoding.initAutocomplete({
        inputId: "map-city-search",
        onSelect: (result) => this._flyToCity(result),
        debounce: 400,
      });
    }

    this._loadLeaflet();

    // Registra eventos dos filtros
    document.querySelectorAll("#map-filters input[type='checkbox']").forEach((cb) => {
      cb.addEventListener("change", (e) => {
        const filter = e.target.dataset.filter;
        this._filters[filter] = e.target.checked;
        this._applyFilters();
        this._updateFilterUI();
      });
    });

    // Registra clique nos itens da lista de rotas
    document.querySelectorAll(".route-list-item").forEach((el) => {
      el.addEventListener("click", () => {
        const idx = parseInt(el.dataset.index);
        this._focusRoute(idx);
      });
    });
  },

  // ── Atualização de UI dos filtros ────────────────────

  _updateFilterUI() {
    document.querySelectorAll("#map-filters label").forEach((label) => {
      const cb = label.querySelector("input[type='checkbox']");
      const filter = cb?.dataset.filter;
      if (!filter) return;

      const styles = {
        active: ["bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300", "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"],
        completed: ["bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300", "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"],
        loads: ["bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300", "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"],
        cities: ["bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300", "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"],
      };

      const [activeStyle, inactiveStyle] = styles[filter] || styles.active;
      label.className = `inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${this._filters[filter] ? activeStyle : inactiveStyle}`;
    });
  },

  // ── Leaflet Bootstrap ────────────────────────────────

  /**
   * Carrega Leaflet dinamicamente via CDN
   */
  async _loadLeaflet() {
    if (this._initPromise) return this._initPromise;

    this._initPromise = this._bootstrapLeaflet();
    return this._initPromise;
  },

  async _bootstrapLeaflet() {
    if (window.L && window.L.markerClusterGroup) {
      this._initMap();
      return;
    }

    try {
      // 1. Leaflet CSS
      const leafletCss = document.createElement("link");
      leafletCss.rel = "stylesheet";
      leafletCss.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(leafletCss);

      // 2. MarkerCluster CSS
      const clusterCss = document.createElement("link");
      clusterCss.rel = "stylesheet";
      clusterCss.href = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css";
      document.head.appendChild(clusterCss);

      const clusterDefaultCss = document.createElement("link");
      clusterDefaultCss.rel = "stylesheet";
      clusterDefaultCss.href = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css";
      document.head.appendChild(clusterDefaultCss);

      // 3. Leaflet JS
      const leafletScript = document.createElement("script");
      leafletScript.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      await new Promise((resolve, reject) => {
        leafletScript.onload = resolve;
        leafletScript.onerror = reject;
        document.body.appendChild(leafletScript);
      });

      // 4. MarkerCluster JS
      const clusterScript = document.createElement("script");
      clusterScript.src = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js";
      await new Promise((resolve, reject) => {
        clusterScript.onload = resolve;
        clusterScript.onerror = reject;
        document.body.appendChild(clusterScript);
      });

      this._initMap();
    } catch (err) {
      console.error("Erro ao carregar Leaflet:", err);
      const container = document.getElementById("map-container");
      if (container) {
        container.innerHTML = `
          <div class="text-center text-gray-400 p-8">
            <svg class="w-16 h-16 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
            <p class="text-lg font-medium text-gray-500">Erro ao carregar mapa</p>
            <button onclick="MapsPage._loadLeaflet()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              Tentar novamente
            </button>
          </div>`;
      }
    }
  },

  // ── Inicialização do Mapa ────────────────────────────

  _initMap() {
    const container = document.getElementById("map-container");
    if (!container) return;

    // Remove loading indicator
    const loading = document.getElementById("map-loading");
    if (loading) loading.style.display = "none";

    // Cria container do mapa
    let mapDiv = document.getElementById("leaflet-map");
    if (!mapDiv) {
      mapDiv = document.createElement("div");
      mapDiv.id = "leaflet-map";
      mapDiv.className = "w-full h-full";
      container.appendChild(mapDiv);
    }

    const isDark = document.documentElement.classList.contains("dark");

    const tiles = isDark
      ? L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OSM</a> &copy; <a href='https://carto.com/'>CARTO</a>",
          maxZoom: 19,
          subdomains: "abcd",
        })
      : L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
          maxZoom: 19,
        });

    this._map = L.map("leaflet-map", {
      center: [-15.7801, -47.9292],
      zoom: 4.5,
      layers: [tiles],
      zoomControl: true,
    });

    L.control.scale({ position: "bottomleft", metric: true, imperial: false }).addTo(this._map);

    // Plotagem assíncrona — chama _fitBounds ao final
    this._plotAll().then(() => {
      if (this._params.highlight) {
        const idx = this._routes.findIndex(
          (r) => r.id == this._params.highlight || r.id == this._params.matchId
        );
        if (idx >= 0) {
          setTimeout(() => this._focusRoute(idx), 300);
        } else {
          console.warn(`[MapsPage] Nenhuma rota encontrada para highlight:`, this._params.highlight);
        }
      }
    });
  },

  /**
   * Plotagem completa: rotas → cargas → cidades → fitBounds
   */
  async _plotAll() {
    await Promise.all([this._plotRoutes(), this._plotLoads(), this._plotCities()]);
    // Tudo plotado — ajusta zoom para cobrir tudo
    this._fitBounds();

    // Aplica estado inicial dos filtros
    this._applyFilters();

    Toast.success("Mapa carregado com sucesso!");
  },

  // ── Plotar Rotas ─────────────────────────────────────

  /**
   * Cria feature groups separados por status de rota.
   * Isso permite toggle seguro sem iterar/remover camadas individualmente.
   */
  async _plotRoutes() {
    const activeGroup = L.featureGroup();
    const completedGroup = L.featureGroup();
    const cancelledGroup = L.featureGroup();

    // Stagger entre requisições OSRM para evitar rate limit
    for (let i = 0; i < this._routes.length; i++) {
      const r = this._routes[i];
      const origin = this._getCoords(r.origin_city, r.origin_state);
      const dest = this._getCoords(r.destination_city, r.destination_state);
      if (!origin || !dest) continue;

      // Define grupo com base no status
      let targetGroup;
      let color, weight, dash;

      if (r.status === "active") {
        targetGroup = activeGroup;
        color = "#3B82F6";
        weight = 3;
        dash = r.is_return ? "10, 8" : null;
      } else if (r.status === "completed") {
        targetGroup = completedGroup;
        color = "#9CA3AF";
        weight = 2.5;
        dash = null;
      } else {
        targetGroup = cancelledGroup;
        color = "#F87171";
        weight = 2;
        dash = "5, 5";
      }

      // Tenta OSRM com cache e stagger
      let coords = null;
      const cacheKey = `${r.origin_city}/${r.destination_city}`;

      if (this._routeCache[cacheKey]) {
        coords = this._routeCache[cacheKey];
      } else {
        // Stagger de 200ms entre requisições OSRM
        await new Promise((resolve) => setTimeout(resolve, 200 * i));
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;
          const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
          if (res.ok) {
            const data = await res.json();
            if (data.routes?.[0]?.geometry?.coordinates) {
              coords = data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);
              this._routeCache[cacheKey] = coords;
            }
          }
        } catch {
          // Fallback: linha reta
        }
      }

      // Fallback se OSRM falhar
      if (!coords) {
        coords = [
          [origin.lat, origin.lng],
          [dest.lat, dest.lng],
        ];
      }

      const polyline = L.polyline(coords, {
        color,
        weight,
        opacity: 0.85,
        dashArray: dash || null,
        smoothFactor: 1.5,
      });

      // Popup com detalhes
      polyline.bindPopup(this._buildRoutePopup(r), {
        maxWidth: 300,
        className: "custom-popup",
      });

      polyline._routeIndex = i;
      polyline.on("mouseover", () => polyline.setStyle({ weight: weight + 2, opacity: 1 }));
      polyline.on("mouseout", () => polyline.setStyle({ weight, opacity: 0.85 }));

      targetGroup.addLayer(polyline);

      // Marcadores de origem e destino
      const origIcon = L.divIcon({
        className: "",
        html: `<div style="width:16px;height:16px;border-radius:50%;background:#2563EB;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const destIcon = L.divIcon({
        className: "",
        html: `<div style="width:16px;height:16px;border-radius:50%;background:#DC2626;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      L.marker([origin.lat, origin.lng], { icon: origIcon })
        .bindPopup(`<b>${r.origin_city}</b> — ${r.origin_state}`)
        .addTo(targetGroup);

      L.marker([dest.lat, dest.lng], { icon: destIcon })
        .bindPopup(`<b>${r.destination_city}</b> — ${r.destination_state}`)
        .addTo(targetGroup);
    }

    // Armazena grupos (visibilidade gerenciada pelo _applyFilters em _plotAll)
    this._groups.activeRoutes = activeGroup;
    this._groups.completedRoutes = completedGroup;
    this._groups.cancelledRoutes = cancelledGroup;
  },

  /**
   * Cria HTML do popup para uma rota
   */
  _buildRoutePopup(r) {
    const statusStyle =
      r.status === "active"
        ? "background:#dbeafe;color:#1e40af;"
        : r.status === "completed"
          ? "background:#f3f4f6;color:#6b7280;"
          : "background:#fee2e2;color:#991b1b;";

    return `
      <div style="min-width:220px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <div style="font-weight:700;font-size:14px;margin-bottom:6px;color:#1f2937;">
          ${r.origin_city} → ${r.destination_city}
        </div>
        <div style="font-size:12px;color:#6b7280;margin-bottom:4px;">
          <b>Motorista:</b> ${r.driver_name || "—"}
        </div>
        <div style="font-size:12px;color:#6b7280;margin-bottom:4px;">
          <b>Data:</b> ${r.departure_date || "—"} → ${r.arrival_date || "—"}
        </div>
        <div style="font-size:12px;color:#6b7280;margin-bottom:4px;">
          <b>Capacidade:</b> ${r.available_weight ? Utils.formatNumber(r.available_weight) + " kg" : "—"}
          ${r.available_volume ? " · " + Utils.formatNumber(r.available_volume) + " m³" : ""}
        </div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:6px;">
          <span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:500;${statusStyle}">
            ${Utils.getStatusLabel(r.status)}
          </span>
          ${r.is_return ? '<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:500;background:#e0e7ff;color:#3730a3;">Retorno</span>' : ""}
        </div>
      </div>
    `;
  },

  // ── Plotar Cargas (com clustering) ─────────────────

  _plotLoads() {
    const group = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 15,
    });

    this._loads.forEach((l) => {
      const dest = this._getCoords(l.destination_city, l.destination_state);
      if (!dest) return;

      const icon = L.divIcon({
        className: "",
        html: `
          <div style="position:relative;">
            <div style="width:20px;height:20px;border-radius:50%;background:#F59E0B;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
              <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            </div>
          </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker([dest.lat, dest.lng], { icon });
      marker.bindPopup(`
        <div style="min-width:200px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="font-weight:700;font-size:13px;margin-bottom:4px;color:#1f2937;">${Utils.escapeHtml(l.title)}</div>
          <div style="font-size:12px;color:#6b7280;">
            <b>Empresa:</b> ${Utils.escapeHtml(l.company_name || "—")}<br>
            <b>Origem:</b> ${l.origin_city} → <b>Destino:</b> ${l.destination_city}<br>
            <b>Peso:</b> ${Utils.formatNumber(l.weight_kg)} kg
            ${l.volume_m3 ? " · <b>Vol:</b> " + l.volume_m3 + " m³" : ""}<br>
            <b>Coleta:</b> ${l.pickup_date || "—"}
          </div>
          <div style="margin-top:6px;">
            <span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:500;${
              l.status === "available"
                ? "background:#dbeafe;color:#1e40af;"
                : l.status === "pending"
                  ? "background:#fef3c7;color:#92400e;"
                  : l.status === "delivered"
                    ? "background:#d1fae5;color:#065f46;"
                    : "background:#fee2e2;color:#991b1b;"
            }">
              ${Utils.getStatusLabel(l.status)}
            </span>
          </div>
        </div>
      `);

      group.addLayer(marker);
    });

    this._groups.loads = group;
  },

  // ── Plotar Cidades (com clustering) ─────────────────

  _plotCities() {
    const group = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 80,
      spiderfyOnMaxZoom: false,
      showCoverageOnHover: false,
      disableClusteringAtZoom: 8,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        let bg = "rgba(139,92,246,0.7)";
        if (count >= 10) { bg = "rgba(124,58,237,0.8)"; }
        if (count >= 50) { bg = "rgba(109,40,217,0.9)"; }
        return L.divIcon({
          html: `<div style="background:${bg};width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:13px;border:2px solid rgba(255,255,255,0.8);box-shadow:0 2px 8px rgba(0,0,0,0.3);">${count}</div>`,
          className: "",
          iconSize: [40, 40],
        });
      },
    });

    const added = new Set();

    this._routes.forEach((r) => {
      [{ name: r.origin_city, state: r.origin_state }, { name: r.destination_city, state: r.destination_state }].forEach((c) => {
        const key = `${c.name}/${c.state}`;
        if (added.has(key)) return;
        added.add(key);

        const coords = this._getCoords(c.name, c.state);
        if (!coords) return;

        const icon = L.divIcon({
          className: "",
          html: `<div style="width:10px;height:10px;border-radius:50%;background:#8B5CF6;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);opacity:0.6;"></div>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        });

        L.marker([coords.lat, coords.lng], { icon })
          .bindPopup(`<b>${c.name}</b> — ${c.state}`)
          .addTo(group);
      });
    });

    this._groups.cities = group;
  },

  // ── Aplicar Filtros ──────────────────────────────────

  /**
   * Toggle visibilidade de grupos inteiros.
   * Suporta tanto L.featureGroup quanto L.markerClusterGroup.
   */
  _applyFilters() {
    const toggle = (group, visible) => {
      if (!group || !this._map) return;
      if (visible) {
        // MarkerClusterGroup e FeatureGroup usam addTo
        group.addTo(this._map);
      } else {
        // FeatureGroup usa removeLayer; MarkerClusterGroup usa remove
        if (group.remove) {
          this._map.removeLayer(group);
        }
      }
    };

    toggle(this._groups.activeRoutes, this._filters.active);
    toggle(this._groups.completedRoutes, this._filters.completed);
    toggle(this._groups.cancelledRoutes, this._filters.active);
    toggle(this._groups.loads, this._filters.loads);
    toggle(this._groups.cities, this._filters.cities);
  },

  // ── Foco em Rota Específica ──────────────────────────

  _focusRoute(index) {
    const r = this._routes[index];
    if (!r || !this._map) {
      console.warn(`[MapsPage] Rota índice ${index} não encontrada`);
      return;
    }

    const origin = this._getCoords(r.origin_city, r.origin_state);
    const dest = this._getCoords(r.destination_city, r.destination_state);
    if (!origin || !dest) return;

    // Fit bounds na rota
    const minLat = Math.min(origin.lat, dest.lat);
    const maxLat = Math.max(origin.lat, dest.lat);
    const minLng = Math.min(origin.lng, dest.lng);
    const maxLng = Math.max(origin.lng, dest.lng);
    const bounds = L.latLngBounds([minLat, minLng], [maxLat, maxLng]);
    this._map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });

    // Destaca item na lista
    document.querySelectorAll(".route-list-item").forEach((el) => {
      el.classList.remove("bg-blue-50", "dark:bg-blue-900/20");
      if (parseInt(el.dataset.index) === index) {
        el.classList.add("bg-blue-50", "dark:bg-blue-900/20");
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });

    // Abre popup da polyline no grupo ativo
    const groups = [this._groups.activeRoutes, this._groups.completedRoutes, this._groups.cancelledRoutes];
    for (const group of groups) {
      if (!group) continue;
      let found = false;
      group.eachLayer((layer) => {
        if (layer._routeIndex === index && layer.openPopup) {
          layer.openPopup();
          found = true;
        }
      });
      if (found) break;
    }
  },

  // ── Ajustar Bounds ───────────────────────────────────

  _fitBounds() {
    if (!this._map) return;

    const allBounds = [];
    Object.values(this._groups).forEach((group) => {
      if (group && group.getBounds) {
        try {
          const b = group.getBounds();
          if (b.isValid()) allBounds.push(b);
        } catch {}
      }
    });

    if (allBounds.length > 0) {
      try {
        const bounds = allBounds.reduce((acc, b) => acc.extend(b), allBounds[0]);
        this._map.fitBounds(bounds, { padding: [40, 40] });
      } catch {}
    } else {
      // Fallback: centro do Brasil
      this._map.setView([-15.7801, -47.9292], 4.5);
    }
  },

  // ── Navegar para Cidade ────────────────────────────

  /**
   * Voar para uma cidade no mapa (vindo da busca)
   */
  _flyToCity(result) {
    if (!this._map) return;
    this._map.flyTo([result.lat, result.lng], 10, { duration: 1.5 });

    // Adiciona marcador temporário
    const icon = L.divIcon({
      className: "",
      html: `<div style="width:24px;height:24px;border-radius:50%;background:#3B82F6;border:3px solid white;box-shadow:0 2px 12px rgba(59,130,246,0.5);display:flex;align-items:center;justify-content:center;">
        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
      </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const marker = L.marker([result.lat, result.lng], { icon })
      .addTo(this._map)
      .bindPopup(`<b>${Utils.escapeHtml(result.display)}</b><br><small>Clique no mapa para remover</small>`)
      .openPopup();

    // Remove ao clicar no mapa
    this._map.once("click", () => {
      if (marker) this._map.removeLayer(marker);
    });
  },

  // ── Destroy ──────────────────────────────────────────

  destroy() {
    if (this._map) {
      this._map.remove();
      this._map = null;
    }
    this._groups = {
      activeRoutes: null,
      completedRoutes: null,
      cancelledRoutes: null,
      loads: null,
      cities: null,
    };
    this._filters = { active: true, completed: false, loads: true, cities: true };
    this._params = {};
    this._initPromise = null;
  },
};
