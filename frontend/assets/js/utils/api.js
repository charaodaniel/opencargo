/**
 * ── OpenCargo — API Service ───────────────────────────
 * Camada de serviço para comunicação com a API.
 * Atualmente usa dados mockados, mas está preparada para
 * integrar com backend REST futuramente.
 */

const Api = {
  /**
   * Cache de dados mockados
   */
  _cache: {},

  /**
   * Carrega dados de um arquivo JSON
   * @param {string} endpoint - Nome do recurso (ex: "users")
   * @returns {Promise<Array>}
   */
  async get(endpoint) {
    // Se estiver em modo mock, carrega do JSON
    if (!CONFIG.API_BASE_URL) {
      return this._loadMock(endpoint);
    }

    // Futuro: chamada real à API
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/${endpoint}`, {
        headers: this._getHeaders(),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();

      // Auto-unwrap respostas paginadas { data, total, page, limit, totalPages } → array
      // As páginas do frontend esperam um array, não o envelope paginado
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
   * Executa um fetch com fallback offline: se estiver offline,
   * enfileira a ação para sincronização posterior.
   */
  async _fetchOrQueue({ endpoint, method, body = null, entityType = "unknown" }) {
    if (!CONFIG.API_BASE_URL) {
      console.log(`[API Mock] ${method} ${endpoint}:`, body);
      return { success: true, id: Utils.generateId(), ...body };
    }

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
      // Se a requisição falhar por falta de rede, enfileira
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
   * Carrega dados mockados do arquivo JSON
   */
  async _loadMock(endpoint) {
    if (this._cache[endpoint]) {
      return this._cache[endpoint];
    }

    try {
      const res = await fetch(`data/${endpoint}.json`);
      if (!res.ok) throw new Error(`Mock not found: ${endpoint}`);
      const data = await res.json();
      this._cache[endpoint] = data;
      return data;
    } catch (error) {
      console.warn(`Mock data "${endpoint}" not available:`, error);
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
   * Limpa o cache
   */
  clearCache() {
    this._cache = {};
  },
};
