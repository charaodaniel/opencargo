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
      return res.json();
    } catch (error) {
      console.error(`API GET ${endpoint} failed:`, error);
      throw error;
    }
  },

  /**
   * Envia dados para a API (futuro)
   */
  async post(endpoint, data) {
    if (!CONFIG.API_BASE_URL) {
      console.log(`[API Mock] POST ${endpoint}:`, data);
      return { success: true, id: Utils.generateId(), ...data };
    }
    const res = await fetch(`${CONFIG.API_BASE_URL}/${endpoint}`, {
      method: "POST",
      headers: this._getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  /**
   * Atualiza dados na API (futuro)
   */
  async put(endpoint, id, data) {
    if (!CONFIG.API_BASE_URL) {
      console.log(`[API Mock] PUT ${endpoint}/${id}:`, data);
      return { success: true, ...data };
    }
    const res = await fetch(`${CONFIG.API_BASE_URL}/${endpoint}/${id}`, {
      method: "PUT",
      headers: this._getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  /**
   * Remove dados na API (futuro)
   */
  async delete(endpoint, id) {
    if (!CONFIG.API_BASE_URL) {
      console.log(`[API Mock] DELETE ${endpoint}/${id}`);
      return { success: true };
    }
    const res = await fetch(`${CONFIG.API_BASE_URL}/${endpoint}/${id}`, {
      method: "DELETE",
      headers: this._getHeaders(),
    });
    return res.json();
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
