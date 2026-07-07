/**
 * ── OpenCargo — Geocoding Utility ──────────────────────
 * Integração com Nominatim (OpenStreetMap) para busca de cidades.
 *
 * Funcionalidades:
 * - Busca de cidades por nome (autocomplete-ready)
 * - Cache LRU de resultados
 * - Debounce para evitar rate limiting do Nominatim
 * - Fallback para cidades conhecidas (sem precisar de API)
 * - Restrição a resultados brasileiros
 *
 * Uso:
 *   const results = await Geocoding.search("São Paulo");
 *   const coords = await Geocoding.geocode("São Paulo", "SP");
 */

const Geocoding = {
  /** Cache de resultados de busca */
  _cache: new Map(),

  /** Cache de coordenadas (city/state → lat/lng) */
  _coordCache: new Map(),

  /** Timer do debounce */
  _debounceTimer: null,

  /** Última requisição para evitar duplicatas */
  _lastRequest: null,

  /** Tamanho máximo do cache LRU */
  _MAX_CACHE: 100,

  // ── Cidades brasileiras conhecidas (fallback sem API) ────
  _KNOWN_CITIES: {
    "são paulo": { lat: -23.5505, lng: -46.6333, state: "SP", display: "São Paulo, SP, Brasil" },
    "porto alegre": { lat: -30.0346, lng: -51.2177, state: "RS", display: "Porto Alegre, RS, Brasil" },
    "rio de janeiro": { lat: -22.9068, lng: -43.1729, state: "RJ", display: "Rio de Janeiro, RJ, Brasil" },
    "belo horizonte": { lat: -19.9167, lng: -43.9345, state: "MG", display: "Belo Horizonte, MG, Brasil" },
    "curitiba": { lat: -25.429, lng: -49.2671, state: "PR", display: "Curitiba, PR, Brasil" },
    "florianópolis": { lat: -27.5945, lng: -48.5477, state: "SC", display: "Florianópolis, SC, Brasil" },
    "campinas": { lat: -22.9099, lng: -47.0626, state: "SP", display: "Campinas, SP, Brasil" },
    "salvador": { lat: -12.9714, lng: -38.5014, state: "BA", display: "Salvador, BA, Brasil" },
    "fortaleza": { lat: -3.7319, lng: -38.5267, state: "CE", display: "Fortaleza, CE, Brasil" },
    "recife": { lat: -8.0476, lng: -34.877, state: "PE", display: "Recife, PE, Brasil" },
    "brasília": { lat: -15.7975, lng: -47.8919, state: "DF", display: "Brasília, DF, Brasil" },
    "manaus": { lat: -3.119, lng: -60.0217, state: "AM", display: "Manaus, AM, Brasil" },
    "goiânia": { lat: -16.6864, lng: -49.2643, state: "GO", display: "Goiânia, GO, Brasil" },
    "vitória": { lat: -20.2976, lng: -40.2958, state: "ES", display: "Vitória, ES, Brasil" },
    "são luís": { lat: -2.5387, lng: -44.2822, state: "MA", display: "São Luís, MA, Brasil" },
    "natal": { lat: -5.7793, lng: -35.2009, state: "RN", display: "Natal, RN, Brasil" },
    "cuiabá": { lat: -15.601, lng: -56.0974, state: "MT", display: "Cuiabá, MT, Brasil" },
    "campo grande": { lat: -20.4697, lng: -54.6201, state: "MS", display: "Campo Grande, MS, Brasil" },
    "belém": { lat: -1.4558, lng: -48.5036, state: "PA", display: "Belém, PA, Brasil" },
    "aracaju": { lat: -10.9095, lng: -37.0678, state: "SE", display: "Aracaju, SE, Brasil" },
    "maceió": { lat: -9.6498, lng: -35.7089, state: "AL", display: "Maceió, AL, Brasil" },
    "joão pessoa": { lat: -7.115, lng: -34.8641, state: "PB", display: "João Pessoa, PB, Brasil" },
    "teresina": { lat: -5.0892, lng: -42.8019, state: "PI", display: "Teresina, PI, Brasil" },
    "rio branco": { lat: -9.974, lng: -67.8076, state: "AC", display: "Rio Branco, AC, Brasil" },
    "macapá": { lat: 0.0356, lng: -51.0705, state: "AP", display: "Macapá, AP, Brasil" },
    "boa vista": { lat: 2.8196, lng: -60.6733, state: "RR", display: "Boa Vista, RR, Brasil" },
    "palmas": { lat: -10.1689, lng: -48.3317, state: "TO", display: "Palmas, TO, Brasil" },
    "porto velho": { lat: -8.7619, lng: -63.9019, state: "RO", display: "Porto Velho, RO, Brasil" },
  },

  /**
   * Busca cidades pelo termo digitado.
   * Retorna resultados rapidamente do cache local ou via Nominatim.
   *
   * @param {string} query - Termo de busca (ex: "São Paulo", "poa")
   * @param {number} limit - Máximo de resultados (default: 8)
   * @returns {Promise<Array>} Lista de resultados com { lat, lng, display, city, state }
   */
  async search(query, limit = 8) {
    if (!query || query.trim().length < 2) return [];

    const normalized = query.trim().toLowerCase();

    // 1. Tenta cache local primeiro
    const cacheKey = `search:${normalized}`;
    if (this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey);
    }

    // 2. Busca em cidades conhecidas (fallback local)
    const localResults = this._searchKnownCities(normalized, limit);
    if (localResults.length >= limit) {
      this._setCache(cacheKey, localResults);
      return localResults;
    }

    // 3. Se não encontrou localmente, busca na Nominatim API
    try {
      const results = await this._fetchNominatim(normalized, limit);

      // Mescla com resultados locais (priorizando os conhecidos)
      const merged = this._mergeResults(localResults, results, limit);

      this._setCache(cacheKey, merged);
      return merged;
    } catch (err) {
      console.warn("[Geocoding] Nominatim error, fallback local:", err.message);
      return localResults;
    }
  },

  /**
   * Busca cidades conhecidas localmente (sem API)
   */
  _searchKnownCities(query, limit) {
    const results = [];

    // Match exato primeiro
    if (this._KNOWN_CITIES[query]) {
      const c = this._KNOWN_CITIES[query];
      results.push({
        lat: c.lat,
        lng: c.lng,
        display: c.display,
        city: query.split(",")[0],
        state: c.state,
        source: "local",
      });
    }

    // Match parcial
    for (const [key, c] of Object.entries(this._KNOWN_CITIES)) {
      if (results.length >= limit) break;
      if (key === query) continue; // já adicionado
      if (key.includes(query) || query.includes(key)) {
        results.push({
          lat: c.lat,
          lng: c.lng,
          display: c.display,
          city: key.split(",")[0],
          state: c.state,
          source: "local",
        });
      }
    }

    return results;
  },

  /**
   * Consulta Nominatim API
   * Respeita User-Agent e rate limit (1 req/s)
   */
  async _fetchNominatim(query, limit) {
    // Rate limiting: 1 requisição por segundo
    const now = Date.now();
    if (this._lastRequest && now - this._lastRequest < 1100) {
      await new Promise((resolve) => setTimeout(resolve, 1100 - (now - this._lastRequest)));
    }
    this._lastRequest = Date.now();

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${query}, Brasil`)}&limit=${limit}&addressdetails=1&featuretype=city`;

    const res = await fetch(url, {
      headers: { "User-Agent": "OpenCargo/0.1.0 (logistics platform)" },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) throw new Error(`Nominatim returned ${res.status}`);

    const data = await res.json();

    return data
      .filter((item) => item.type === "city" || item.type === "town" || item.type === "administrative")
      .slice(0, limit)
      .map((item) => {
        const address = item.address || {};
        const city = address.city || address.town || address.village || address.municipality || item.display_name.split(",")[0].trim();
        const state = address.state || "";
        return {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          display: `${city}, ${state}${state ? ", Brasil" : ""}`,
          city,
          state,
          source: "nominatim",
          raw: item,
        };
      });
  },

  /**
   * Mescla resultados locais com Nominatim, sem duplicatas
   */
  _mergeResults(local, remote, limit) {
    const seen = new Set();
    const merged = [];

    for (const r of [...local, ...remote]) {
      const key = `${r.city}|${r.state}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(r);
      if (merged.length >= limit) break;
    }

    return merged;
  },

  /**
   * Obtém coordenadas de uma cidade (com fallback local)
   *
   * @param {string} city - Nome da cidade
   * @param {string} state - Sigla do estado (opcional)
   * @returns {Promise<{lat: number, lng: number}|null>}
   */
  async geocode(city, state = "") {
    const key = `${city}/${state}`;

    // Cache local
    if (this._coordCache.has(key)) {
      return this._coordCache.get(key);
    }

    // Tenta cidades conhecidas
    const normalized = city.toLowerCase().trim();
    const known = this._KNOWN_CITIES[normalized];
    if (known) {
      this._coordCache.set(key, { lat: known.lat, lng: known.lng });
      return { lat: known.lat, lng: known.lng };
    }

    // Consulta Nominatim
    try {
      const query = state ? `${city}, ${state}, Brasil` : `${city}, Brasil`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

      const res = await fetch(url, {
        headers: { "User-Agent": "OpenCargo/0.1.0" },
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
      const data = await res.json();

      if (data.length > 0) {
        const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        this._coordCache.set(key, coords);
        return coords;
      }

      return null;
    } catch (err) {
      console.warn(`[Geocoding] Erro ao geocodificar "${city}":`, err.message);
      return null;
    }
  },

  /**
   * Cria um input de busca com autocomplete para cidades
   *
   * @param {Object} options
   * @param {string} options.placeholder - Placeholder do input
   * @param {Function} options.onSelect - Callback quando cidade é selecionada
   * @param {string} options.value - Valor inicial
   * @param {string} options.id - ID do elemento
   * @returns {string} HTML do componente
   *
   * Exemplo de uso:
   *   Geocoding.createAutocomplete({
   *     placeholder: "Buscar cidade...",
   *     onSelect: (result) => { map.flyTo([result.lat, result.lng], 10); },
   *   })
   */
  createAutocomplete({ placeholder = "Buscar cidade...", onSelect, value = "", id = "geocoding-input", name = "" } = {}) {
    return `
      <div class="relative" id="${id}-wrapper">
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text"
            id="${id}"
            name="${name}"
            value="${Utils.escapeHtml(value)}"
            placeholder="${Utils.escapeHtml(placeholder)}"
            autocomplete="off"
            class="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
          <div id="${id}-spinner" class="absolute right-3 top-1/2 -translate-y-1/2 hidden">
            <svg class="w-4 h-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
          </div>
        </div>
        <div id="${id}-results"
          class="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto hidden"
        ></div>
      </div>
    `;
  },

  /**
   * Inicializa o autocomplete em um input existente.
   * Deve ser chamado após o HTML ser inserido no DOM.
   *
   * @param {Object} options
   * @param {string} options.inputId - ID do input
   * @param {Function} options.onSelect - Callback ao selecionar cidade
   * @param {number} options.debounce - Delay do debounce (ms)
   */
  initAutocomplete({ inputId = "geocoding-input", onSelect, debounce = 400 } = {}) {
    const input = document.getElementById(inputId);
    const resultsEl = document.getElementById(`${inputId}-results`);
    const spinner = document.getElementById(`${inputId}-spinner`);
    if (!input || !resultsEl) return;

    let abortController = null;
    let selected = false;

    const doSearch = async (query) => {
      // Cancela requisição anterior
      if (abortController) abortController.abort();
      abortController = new AbortController();

      if (query.length < 2) {
        resultsEl.classList.add("hidden");
        resultsEl.innerHTML = "";
        return;
      }

      spinner?.classList.remove("hidden");

      try {
        const results = await Geocoding.search(query);

        spinner?.classList.add("hidden");

        if (results.length === 0) {
          resultsEl.innerHTML = `
            <div class="p-3 text-sm text-gray-400 text-center">
              Nenhuma cidade encontrada
            </div>`;
          resultsEl.classList.remove("hidden");
          return;
        }

        resultsEl.innerHTML = results
          .map(
            (r, i) => `
          <button
            type="button"
            class="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center space-x-3 transition-colors ${i === 0 ? "border-l-2 border-blue-500" : ""}"
            data-lat="${r.lat}"
            data-lng="${r.lng}"
            data-city="${Utils.escapeHtml(r.city)}"
            data-state="${Utils.escapeHtml(r.state)}"
            data-display="${Utils.escapeHtml(r.display)}"
          >
            <span class="text-base shrink-0">📍</span>
            <div class="min-w-0">
              <span class="font-medium text-gray-900 dark:text-white block truncate">${Utils.escapeHtml(r.display)}</span>
              <span class="text-xs text-gray-400">${r.source === "local" ? "🌎 Brasil" : "📍 Nominatim"}</span>
            </div>
          </button>
        `
          )
          .join("");

        resultsEl.classList.remove("hidden");

        // Eventos de clique nos resultados
        resultsEl.querySelectorAll("button").forEach((btn) => {
          btn.addEventListener("click", () => {
            selected = true;
            const result = {
              lat: parseFloat(btn.dataset.lat),
              lng: parseFloat(btn.dataset.lng),
              city: btn.dataset.city,
              state: btn.dataset.state,
              display: btn.dataset.display,
            };
            input.value = result.city;
            resultsEl.classList.add("hidden");
            resultsEl.innerHTML = "";
            if (onSelect) onSelect(result);
          });
        });
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("[Geocoding] Erro na busca:", err);
        spinner?.classList.add("hidden");
        resultsEl.innerHTML = `
          <div class="p-3 text-sm text-red-400 text-center">
            Erro ao buscar. Tente novamente.
          </div>`;
        resultsEl.classList.remove("hidden");
      }
    };

    // Input handler com debounce
    input.addEventListener("input", () => {
      selected = false;
      clearTimeout(this._debounceTimer);
      this._debounceTimer = setTimeout(() => {
        doSearch(input.value.trim());
      }, debounce);
    });

    // Fecha resultados ao clicar fora
    document.addEventListener("click", (e) => {
      const wrapper = document.getElementById(`${inputId}-wrapper`);
      if (wrapper && !wrapper.contains(e.target)) {
        resultsEl.classList.add("hidden");
      }
    });

    // Enter no input seleciona primeiro resultado
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const firstBtn = resultsEl.querySelector("button");
        if (firstBtn) {
          firstBtn.click();
        }
      }
      if (e.key === "Escape") {
        resultsEl.classList.add("hidden");
      }
    });

    // Limpa ao fazer focus se estiver vazio
    input.addEventListener("focus", () => {
      if (input.value.trim().length >= 2 && !selected) {
        doSearch(input.value.trim());
      }
    });
  },

  /**
   * Adiciona um resultado ao cache LRU
   */
  _setCache(key, value) {
    if (this._cache.size >= this._MAX_CACHE) {
      const firstKey = this._cache.keys().next().value;
      this._cache.delete(firstKey);
    }
    this._cache.set(key, value);
  },

  /**
   * Limpa todos os caches
   */
  clearCache() {
    this._cache.clear();
    this._coordCache.clear();
  },
};
