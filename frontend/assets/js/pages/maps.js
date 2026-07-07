/**
 * ── OpenCargo — Maps Page ─────────────────────────────
 * Página de mapas para visualização de rotas.
 * Preparada para futura integração com Leaflet + OpenStreetMap.
 */

const MapsPage = {
  /** Instância do mapa Leaflet */
  _map: null,

  async render() {
    return `
      <div class="fade-in">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Mapa</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">Visualização de rotas e geolocalização</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Mapa -->
          <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden" style="height: 500px;">
            <div id="map-container" class="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <div class="text-center text-gray-400">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                </svg>
                <p class="text-lg font-medium">Mapa OpenStreetMap</p>
                <p class="text-sm mt-1">Integração com Leaflet em breve</p>
                <button onclick="MapsPage.loadLeaflet()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  Carregar Mapa
                </button>
              </div>
            </div>
          </div>

          <!-- Sidebar de informações -->
          <div class="space-y-4">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">📍 Rotas do Dia</h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">SP → POA</p>
                    <p class="text-xs text-gray-500">João Silva • 1.100 km</p>
                  </div>
                  <span class="text-xs text-green-600 font-medium">Ativa</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">RJ → BH</p>
                    <p class="text-xs text-gray-500">Pedro Transportes • 440 km</p>
                  </div>
                  <span class="text-xs text-green-600 font-medium">Ativa</span>
                </div>
              </div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">📊 Estatísticas</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">Total de Rotas</span>
                  <span class="font-medium text-gray-900 dark:text-white">5</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Rotas Ativas</span>
                  <span class="font-medium text-green-600">4</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Distância Total</span>
                  <span class="font-medium text-gray-900 dark:text-white">~3.200 km</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Carrega Leaflet dinamicamente e inicializa o mapa
   */
  async loadLeaflet() {
    const container = document.getElementById("map-container");
    if (!container) return;

    try {
      // Carrega Leaflet via CDN
      const L = await this._loadLeafletCSS();

      // Substitui placeholder pelo mapa
      container.innerHTML = '<div id="leaflet-map" class="w-full h-full"></div>';

      // Inicializa mapa
      this._map = L.map("leaflet-map").setView([-15.7801, -47.9292], 4);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(this._map);

      // Adiciona marcadores de exemplo
      const markers = [
        { lat: -23.5505, lng: -46.6333, title: "São Paulo" },
        { lat: -30.0346, lng: -51.2177, title: "Porto Alegre" },
        { lat: -22.9068, lng: -43.1729, title: "Rio de Janeiro" },
        { lat: -19.9167, lng: -43.9345, title: "Belo Horizonte" },
      ];

      markers.forEach((m) => {
        L.marker([m.lat, m.lng])
          .addTo(this._map)
          .bindPopup(`<b>${m.title}</b>`);
      });

      Toast.success("Mapa carregado com sucesso!");
    } catch (error) {
      console.error("Erro ao carregar mapa:", error);
      Toast.error("Erro ao carregar mapa. Verifique sua conexão.");
    }
  },

  /**
   * Carrega CSS do Leaflet dinamicamente
   */
  _loadLeafletCSS() {
    return new Promise((resolve, reject) => {
      // Verifica se já foi carregado
      if (window.L) return resolve(window.L);

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => resolve(window.L);
      script.onerror = reject;
      document.body.appendChild(script);
    });
  },

  /**
   * Limpa o mapa ao sair da página
   */
  destroy() {
    if (this._map) {
      this._map.remove();
      this._map = null;
    }
  },
};
