/**
 * ── OpenCargo — API Service ───────────────────────────
 * Camada de serviço para comunicação com a API.
 * Atualmente usa dados mockados, mas está preparada para
 * integrar com backend REST futuramente.
 */

const Api = {
  /**
   * Cache de dados mockados (cópia imutável da leitura do JSON)
   */
  _cache: {},

  /**
   * Armazenamento mutável para dados mockados em memória.
   * Inicializado a partir dos arquivos JSON, mas permite
   * POST/PATCH/DELETE durante a sessão sem modificar os arquivos.
   */
  _mockStore: {},

  /**
   * Contador incremental para gerar IDs numéricos únicos em mock mode
   */
  _mockIdCounter: 1000,

  /**
   * Extrai o nome base do endpoint (ex: "loads/123" → "loads")
   */
  _endpointBase(endpoint) {
    return endpoint.split("/")[0];
  },

  /**
   * Carrega dados de um arquivo JSON
   * @param {string} endpoint - Nome do recurso (ex: "users")
   * @returns {Promise<Array>}
   */
  async get(endpoint) {
    // Se estiver em modo mock, carrega do mock store
    if (!CONFIG.API_BASE_URL) {
      return this._loadMock(endpoint);
    }

    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/${endpoint}`, {
        headers: this._getHeaders(),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();

      // Auto-unwrap respostas paginadas { data, total, page, limit, totalPages } → array
      if (json && typeof json === "object" && Array.isArray(json.data)) {
        return json.data;
      }

      return json;
    } catch (error) {
      console.error(`API GET ${endpoint} failed:`, error);
      throw error;
    }
  },

  /**
   * Executa um fetch com fallback offline.
   * Em modo mock, persiste as mutações no _mockStore.
   */
  async _fetchOrQueue({ endpoint, method, body = null, entityType = "unknown" }) {
    // ── Modo mock: persiste em memória ─────────────────────
    if (!CONFIG.API_BASE_URL) {
      return this._mockMutation(endpoint, method, body);
    }

    // ── Modo real ──────────────────────────────────────────
    // Se estiver offline, enfileira
    if (!navigator.onLine) {
      const item = OfflineQueue.add({
        url: endpoint,
        method,
        body,
        entityType,
      });
      Toast.info(`📥 Ação enfileirada para quando houver internet (fila: ${OfflineQueue.count()})`);
      return { success: true, queued: true, queueId: item.id, ...body };
    }

    try {
      const res = await this._fetch(endpoint, method, body);
      return res;
    } catch (err) {
      if (err.message === "Failed to fetch" || err.name === "TypeError") {
        const item = OfflineQueue.add({
          url: endpoint,
          method,
          body,
          entityType,
        });
        Toast.info(`📥 Ação enfileirada para quando houver internet (fila: ${OfflineQueue.count()})`);
        return { success: true, queued: true, queueId: item.id, ...body };
      }
      throw err;
    }
  },

  /**
   * Converte camelCase para snake_case.
   * Ex: "originCity" → "origin_city", "weightKg" → "weight_kg"
   */
  _camelToSnake(obj) {
    if (!obj || typeof obj !== "object") return obj;
    const result = {};
    for (const key of Object.keys(obj)) {
      const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
      result[snakeKey] = obj[key];
    }
    return result;
  },

  /**
   * Aplica mutação no _mockStore para simular persistência.
   * Converte campos camelCase do payload para snake_case
   * para manter consistência com dados carregados do JSON.
   */
  _mockMutation(endpoint, method, body) {
    const base = this._endpointBase(endpoint);

    if (!this._mockStore[base]) {
      this._mockStore[base] = this._cache[base]
        ? JSON.parse(JSON.stringify(this._cache[base]))
        : [];
    }

    // Normaliza campos camelCase → snake_case
    const normalizedBody = this._camelToSnake(body || {});

    switch (method) {
      case "POST": {
        this._mockIdCounter++;
        const id = this._mockIdCounter;
        const newItem = {
          id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...normalizedBody,
        };
        this._mockStore[base].unshift(newItem);
        this._cache[base] = this._mockStore[base];
        console.log(`[API Mock] POST ${endpoint} → id=${id}`);
        return { success: true, id, ...body };
      }

      case "PATCH":
      case "PUT": {
        const parts = endpoint.split("/");
        const itemId = parts.length > 1 ? parts[1] : null;
        if (itemId && this._mockStore[base]) {
          const idx = this._mockStore[base].findIndex(
            (item) => String(item.id) === itemId
          );
          if (idx !== -1) {
            this._mockStore[base][idx] = {
              ...this._mockStore[base][idx],
              ...normalizedBody,
              updated_at: new Date().toISOString(),
            };
            this._cache[base] = this._mockStore[base];
            console.log(`[API Mock] ${method} ${endpoint}`);
            return { success: true, ...this._mockStore[base][idx] };
          }
        }
        return { success: true, ...body };
      }

      case "DELETE": {
        const parts = endpoint.split("/");
        const itemId = parts.length > 1 ? parts[1] : null;
        if (itemId && this._mockStore[base]) {
          this._mockStore[base] = this._mockStore[base].filter(
            (item) => String(item.id) !== itemId
          );
          this._cache[base] = this._mockStore[base];
          console.log(`[API Mock] DELETE ${endpoint}`);
        }
        return { success: true };
      }

      default:
        console.log(`[API Mock] ${method} ${endpoint}:`, body);
        return { success: true, ...body };
    }
  },

  /**
   * Executa fetch real com headers
   */
  async _fetch(endpoint, method, body = null) {
    const res = await fetch(`${CONFIG.API_BASE_URL}/${endpoint}`, {
      method,
      headers: this._getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `API error: ${res.status}`);
    }
    if (res.status === 204) return { success: true };
    return res.json();
  },

  /**
   * Envia dados para a API (com suporte offline)
   */
  async post(endpoint, data) {
    return this._fetchOrQueue({
      endpoint,
      method: "POST",
      body: data,
      entityType: endpoint.split("/")[0],
    });
  },

  /**
   * Atualiza dados na API (com suporte offline)
   */
  async put(endpoint, id, data) {
    return this._fetchOrQueue({
      endpoint: `${endpoint}/${id}`,
      method: "PUT",
      body: data,
      entityType: endpoint,
    });
  },

  /**
   * Remove dados na API (com suporte offline)
   */
  async delete(endpoint, id) {
    return this._fetchOrQueue({
      endpoint: `${endpoint}/${id}`,
      method: "DELETE",
      entityType: endpoint,
    });
  },

  /**
   * Atualização parcial na API (com suporte offline)
   * @param {string} path - Caminho após a base URL (ex: "notifications/abc-123/read")
   * @param {object} [data] - Dados opcionais para enviar no body
   */
  async patch(path, data) {
    return this._fetchOrQueue({
      endpoint: path,
      method: "PATCH",
      body: data,
      entityType: path.split("/")[0],
    });
  },

  /**
   * Carrega dados mockados do _mockStore.
   * Na primeira chamada, popula o _mockStore a partir do JSON.
   */
  async _loadMock(endpoint) {
    const base = this._endpointBase(endpoint);

    // Se já está no mock store, retorna dele
    if (this._mockStore[base]) {
      return this._mockStore[base];
    }

    // Se está no cache, copia para o mock store
    if (this._cache[base]) {
      this._mockStore[base] = JSON.parse(JSON.stringify(this._cache[base]));
      return this._mockStore[base];
    }

    // Primeira carga: busca do JSON
    try {
      const res = await fetch(`data/${base}.json`);
      if (!res.ok) throw new Error(`Mock not found: ${base}`);
      const data = await res.json();
      this._cache[base] = data;
      this._mockStore[base] = JSON.parse(JSON.stringify(data));
      return this._mockStore[base];
    } catch (error) {
      console.warn(`Mock data "${base}" not available:`, error);
      this._mockStore[base] = [];
      return [];
    }
  },

  /**
   * Headers padrão para requisições
   */
  _getHeaders() {
    const headers = { "Content-Type": "application/json" };
    const token = Storage.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  },

  /**
   * Limpa o cache e o mock store
   */
  clearCache() {
    this._cache = {};
    this._mockStore = {};
  },
};
