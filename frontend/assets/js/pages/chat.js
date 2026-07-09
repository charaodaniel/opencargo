/**
 * ── OpenCargo — Chat Page ─────────────────────────────
 * Interface de chat semelhante ao WhatsApp Web.
 * Comunicação entre empresas e motoristas.
 */

const ChatPage = {
  /** Match selecionado atualmente */
  _selectedMatchId: null,

  async render() {
    // Nota: mensagens são carregadas individualmente ao selecionar um match
    // O backend expõe GET /api/chat/messages/:matchId (não /api/messages)
    // e GET /api/matching (não /api/matches)
    let matches = [];
    try {
      const matchData = await Api.get("matching");
      matches = Array.isArray(matchData) ? matchData : (matchData?.data || []);
    } catch {
      matches = [];
    }

    const activeMatches = matches.filter((m) => ["pending", "accepted"].includes(m.status));

    return `
      <div class="fade-in">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Chat</h1>

        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden" style="height: calc(100vh - 260px);">
          <div class="flex h-full">
            <!-- Sidebar de conversas -->
            <div class="w-72 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0">
              <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Conversas</h3>
              </div>
              <div class="flex-1 overflow-y-auto">
                ${activeMatches.length === 0
                  ? `<div class="p-4 text-sm text-gray-400 text-center">Nenhuma conversa ativa.<br>Faça um match para começar.</div>`
                  : activeMatches
                      .map(
                        (m) => `
                  <button onclick="ChatPage.selectMatch('${m.id}')" 
                    class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 transition-colors chat-match-item" 
                    data-match-id="${m.id}">
                    <div class="flex items-center space-x-3">
                      <div class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style="background-color: ${Utils.getAvatarColor(m.driver_name)}">
                        ${Utils.getInitials(m.driver_name)}
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="text-sm font-medium text-gray-900 dark:text-white truncate">${Utils.escapeHtml(m.driver_name)}</p>
                        <p class="text-xs text-gray-500 truncate">${Utils.escapeHtml(m.load_title)}</p>
                      </div>
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${Utils.getStatusClass(m.status)}">
                        ${Utils.getStatusLabel(m.status)}
                      </span>
                    </div>
                  </button>
                `
                      )
                      .join("")}
              </div>
            </div>

            <!-- Área principal do chat -->
            <div class="flex-1 flex flex-col" id="chat-main-area">
              ${this._renderEmptyState()}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Renderiza estado vazio (nenhuma conversa selecionada)
   */
  _renderEmptyState() {
    return `
      <div class="flex-1 flex items-center justify-center text-gray-400">
        <div class="text-center">
          <svg class="w-20 h-20 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          <p class="text-lg font-medium">Selecione uma conversa</p>
          <p class="text-sm">Escolha um match à esquerda para conversar</p>
        </div>
      </div>
    `;
  },

  /**
   * Seleciona um match e carrega as mensagens
   */
  async selectMatch(matchId) {
    this._selectedMatchId = matchId;

    // Destaca o item selecionado
    document.querySelectorAll(".chat-match-item").forEach((el) => {
      el.classList.toggle("bg-gray-50", el.dataset.matchId === matchId);
      el.classList.toggle("dark:bg-gray-700/50", el.dataset.matchId === matchId);
    });

    // Carrega mensagens via endpoint correto: GET /api/chat/messages/:matchId
    let matchMessages = [];
    try {
      const msgData = await Api.get(`chat/messages/${matchId}`);
      matchMessages = Array.isArray(msgData) ? msgData : (msgData?.data || []);
    } catch {
      matchMessages = [];
    }

    const mainArea = document.getElementById("chat-main-area");
    mainArea.innerHTML = this._renderChat(matchMessages);
  },

  /**
   * Renderiza a área de chat com mensagens
   */
  _renderChat(messages) {
    // Usuário logado - vem do Storage
    const currentUser = Storage.getUser() || { id: 2 };
    const currentUserId = currentUser.id;

    return `
      <div class="flex-1 overflow-y-auto p-4 space-y-3" id="chat-messages-container">
        ${messages.length === 0
          ? `<div class="text-center text-gray-400 text-sm py-8">Nenhuma mensagem ainda. Envie a primeira!</div>`
          : messages
              .map(
                (msg) => `
          <div class="flex ${msg.sender_id === currentUserId ? "justify-end" : "justify-start"}">
            <div class="max-w-[75%] rounded-xl px-4 py-2.5 ${
              msg.sender_id === currentUserId
                ? "bg-blue-600 text-white rounded-br-sm"
                : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm"
            }">
              <p class="text-sm">${Utils.escapeHtml(msg.content)}</p>
              <div class="flex items-center justify-end space-x-1 mt-1">
                <p class="text-xs ${msg.sender_id === currentUserId ? "text-blue-200" : "text-gray-400"}">${Utils.formatDate(msg.created_at, true)}</p>
              </div>
            </div>
          </div>
        `
              )
              .join("")}
      </div>

      <!-- Input -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onsubmit="ChatPage.sendMessage(event)" class="flex space-x-3">
          <input type="text" id="chat-input" required placeholder="Digite sua mensagem..."
            class="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" />
          <button type="submit" class="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
          </button>
        </form>
      </div>
    `;
  },

  /**
   * Envia uma mensagem
   */
  sendMessage(event) {
    event.preventDefault();
    const input = document.getElementById("chat-input");
    const content = input.value.trim();
    if (!content) return;

    // Adiciona a mensagem na interface
    const container = document.getElementById("chat-messages-container");
    const msgHtml = `
      <div class="flex justify-end">
        <div class="max-w-[75%] rounded-xl px-4 py-2.5 bg-blue-600 text-white rounded-br-sm">
          <p class="text-sm">${Utils.escapeHtml(content)}</p>
          <p class="text-xs text-blue-200 mt-1">Agora</p>
        </div>
      </div>
    `;

    container.insertAdjacentHTML("beforeend", msgHtml);
    container.scrollTop = container.scrollHeight;
    input.value = "";

    Toast.success("Mensagem enviada!");
  },

  /**
   * Hook executado após renderizar
   */
  afterRender() {
    // Se houver match selecionado, recarrega
    if (this._selectedMatchId) {
      this.selectMatch(this._selectedMatchId);
    }
  },
};
