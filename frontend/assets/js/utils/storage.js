/**
 * ── OpenCargo — Storage ───────────────────────────────
 * Gerenciamento de armazenamento local (LocalStorage).
 * Responsável por persistir preferências do usuário e
 * dados de sessão.
 */

const Storage = {
  /**
   * Salva um valor no LocalStorage
   * @param {string} key - Chave do item
   * @param {*} value - Valor a ser salvo
   */
  set(key, value) {
    try {
      localStorage.setItem(`opencargo_${key}`, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error("Storage.set error:", e);
      return false;
    }
  },

  /**
   * Recupera um valor do LocalStorage
   * @param {string} key - Chave do item
   * @param {*} defaultValue - Valor padrão se não existir
   * @returns {*} Valor armazenado ou defaultValue
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(`opencargo_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error("Storage.get error:", e);
      return defaultValue;
    }
  },

  /**
   * Remove um item do LocalStorage
   * @param {string} key - Chave do item
   */
  remove(key) {
    localStorage.removeItem(`opencargo_${key}`);
  },

  /**
   * Limpa todos os dados da aplicação
   */
  clear() {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("opencargo_"))
      .forEach((k) => localStorage.removeItem(k));
  },

  // Atalhos para preferências comuns
  getTheme() {
    return this.get("theme", "light");
  },

  setTheme(theme) {
    this.set("theme", theme);
  },

  getUser() {
    return this.get("user", null);
  },

  setUser(user) {
    this.set("user", user);
  },

  getToken() {
    return this.get("token", "");
  },

  setToken(token) {
    this.set("token", token);
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  logout() {
    this.remove("token");
    this.remove("user");
  },
};
