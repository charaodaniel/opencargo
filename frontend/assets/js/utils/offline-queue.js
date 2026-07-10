/**
 * ── OpenCargo — Offline Queue ─────────────────────────
 * Gerencia fila de ações offline (criar carga, rota, etc.)
 * usando localStorage. Quando o usuário volta ao online,
 * a fila é processada automaticamente via Service Worker
 * Background Sync ou diretamente pelo App.
 *
 * Estrutura de cada item:
 * {
 *   id: string (uuid),
 *   url: string (ex: "loads"),
 *   method: "POST" | "PATCH" | "DELETE",
 *   body: object | null,
 *   token: string | null,
 *   createdAt: string (ISO),
 *   lastModified: string (ISO) — atualizado a cada mudança de status/retry,
 *   entityType: string (ex: "load", "route"),
 *   status: "pending" | "processing" | "failed",
 *   retryCount: number (max 3)
 * }
 */

const OfflineQueue = {
  STORAGE_KEY: "opencargo_offline_queue",

  /** Flag para pedir permissão de notificação apenas uma vez */
  _permissionRequested: false,

  /**
   * Adiciona uma ação à fila
   */
  add({ url, method, body = null, entityType = "unknown" }) {
    const queue = this.getAll();
    const item = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      url,
      method,
      body,
      token: Storage.getToken(),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      entityType,
      status: "pending",
      retryCount: 0,
    };
    queue.push(item);
    this._save(queue);
    this._updateBadge();
    // Registra sync no Service Worker
    this._registerSync();
    // Solicita permissão de notificação (uma vez)
    this._ensureNotificationPermission();
    return item;
  },

  /**
   * Remove um item da fila pelo ID
   */
  remove(id) {
    const queue = this.getAll().filter(item => item.id !== id);
    this._save(queue);
    this._updateBadge();
  },

  /**
   * Retorna todos os itens pendentes
   */
  getAll() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Retorna itens pendentes para processamento.
   * Inclui:
   * - Itens com status "pending"
   * - Itens "processing" com mais de 5 minutos (stale recovery)
   * - Itens "failed" com retryCount < 3 (retry automático)
   */
  getPending() {
    const now = Date.now();
    const fiveMin = 5 * 60 * 1000;

    return this.getAll().filter(item => {
      if (item.status === "pending") return true;
      if (item.status === "processing") {
        // Stale recovery: items travados como "processing" há mais de 5 min
        // Usa lastModified em vez de createdAt para detectar corretamente
        // items que entraram em "processing" muito depois de criados
        const ts = item.lastModified || item.createdAt;
        const age = now - new Date(ts).getTime();
        return age > fiveMin;
      }
      if (item.status === "failed" && (item.retryCount || 0) < 3) {
        // Retry automático para falhas (até 3 tentativas)
        return true;
      }
      return false;
    });
  },

  /**
   * Processa toda a fila de ações pendentes
   */
  async processAll() {
    const pending = this.getPending();
    if (pending.length === 0) return { processed: 0, failed: 0 };

    let processed = 0;
    let failed = 0;

    for (const item of pending) {
      try {
        // Marca como "processing"
        this._updateStatus(item.id, "processing");
        const retryCount = item.retryCount || 0;

        const headers = { "Content-Type": "application/json" };
        if (item.token) headers["Authorization"] = `Bearer ${item.token}`;

        const res = await fetch(`${CONFIG.API_BASE_URL}/${item.url}`, {
          method: item.method,
          headers,
          body: item.body ? JSON.stringify(item.body) : undefined,
        });

        if (res.ok || res.status === 201 || res.status === 204) {
          this.remove(item.id);
          processed++;
        } else {
          this._updateStatus(item.id, "failed");
          this._incrementRetry(item.id);
          failed++;
        }
      } catch {
        this._updateStatus(item.id, "failed");
        this._incrementRetry(item.id);
        failed++;
      }
    }

    this._updateBadge();

    if (processed > 0 || failed > 0) {
      // Mostra notificação push se o app não estiver em foco
      if (document.visibilityState !== "visible") {
        this._showSyncNotification(processed, failed);
      }
    }

    if (processed > 0) {
      Toast.success(`${processed} ação(ões) sincronizada(s) com sucesso!`);
    }
    if (failed > 0) {
      Toast.warning(`${failed} ação(ões) falharam na sincronização.`);
    }

    return { processed, failed };
  },

  /**
   * Retorna contagem de pendentes
   */
  count() {
    return this.getPending().length;
  },

  /**
   * Atualiza o status de um item
   */
  _updateStatus(id, status) {
    const queue = this.getAll();
    const item = queue.find(i => i.id === id);
    if (item) {
      item.status = status;
      item.lastModified = new Date().toISOString();
      this._save(queue);
    }
  },

  /**
   * Salva a fila no localStorage
   */
  _save(queue) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error("OfflineQueue: erro ao salvar fila:", e);
    }
  },

  /**
   * Registra sync no Service Worker para Background Sync API
   */
  _registerSync() {
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.sync.register("sync-offline-queue").catch(() => {
          // Se Background Sync não for suportado, o App.processa direto
        });
      });
    }
  },

  /**
   * Incrementa o contador de retry de um item
   */
  _incrementRetry(id) {
    const queue = this.getAll();
    const item = queue.find(i => i.id === id);
    if (item) {
      item.retryCount = (item.retryCount || 0) + 1;
      item.lastModified = new Date().toISOString();
      this._save(queue);
    }
  },

  /**
   * Atualiza o badge na navbar
   */
  _updateBadge() {
    const count = this.count();
    const badge = document.getElementById("offline-queue-badge");
    if (badge) {
      if (count > 0) {
        badge.textContent = count;
        badge.classList.remove("hidden");
      } else {
        badge.classList.add("hidden");
      }
    }
  },

  /**
   * Solicita permissão de notificação ao usuário, se ainda não foi concedida.
   * Usa a API Notification do navegador (Web Notification API).
   * Só pergunta uma vez — após negado, não insiste.
   */
  _ensureNotificationPermission() {
    if (this._permissionRequested) return;
    this._permissionRequested = true;
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {
        // Usuário negou ou o navegador não suporta — silencioso
      });
    }
  },

  /**
   * Exibe uma notificação push (browser Notification) com o resultado
   * da sincronização offline. Só dispara se a permissão foi concedida.
   *
   * @param {number} processed - Quantidade de ações sincronizadas
   * @param {number} failed - Quantidade de ações que falharam
   */
  _showSyncNotification(processed, failed) {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const icon = "/assets/icons/logo-192.png";
    let title, body;

    if (failed === 0) {
      title = "✅ Sincronização concluída";
      body = `${processed} ação(ões) offline sincronizada(s) com sucesso.`;
    } else if (processed === 0) {
      title = "❌ Sincronização falhou";
      body = `${failed} ação(ões) não puderam ser sincronizadas. Toque para ver detalhes.`;
    } else {
      title = "⚠️ Sincronização parcial";
      body = `${processed} ação(ões) sincronizada(s), ${failed} falha(s). Toque para revisar.`;
    }

    const n = new Notification(title, {
      body,
      icon,
      tag: "offline-sync",
    });

    n.onclick = () => {
      window.focus();
      n.close();
    };
  },
};
