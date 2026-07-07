/**
 * ── OpenCargo — Configuração ──────────────────────────
 * Constantes e configurações globais da aplicação.
 */

const CONFIG = {
  // Nome da aplicação
  APP_NAME: "OpenCargo",
  APP_VERSION: "0.1.0",

  // URLs da API
  // Deixe vazio para usar dados mockados (JSON local).
  // Configure para a URL do backend em produção.
  // Ex: "https://api.opencargo.com.br/api"
  API_BASE_URL: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api"
    : "",

  // Intervalos de atualização (ms)
  REFRESH_INTERVAL: 30000,
  NOTIFICATION_POLL_INTERVAL: 15000,

  // Itens por página na paginação
  ITEMS_PER_PAGE: 10,

  // Tempo de exibição do toast (ms)
  TOAST_DURATION: 3500,

  // Status disponíveis para cargas
  LOAD_STATUSES: {
    pending: "Pendente",
    available: "Disponível",
    matched: "Compatível",
    in_transit: "Em Trânsito",
    delivered: "Entregue",
    cancelled: "Cancelado",
  },

  // Status para rotas
  ROUTE_STATUSES: {
    active: "Ativa",
    completed: "Concluída",
    cancelled: "Cancelada",
  },

  // Status para matches
  MATCH_STATUSES: {
    pending: "Pendente",
    accepted: "Aceito",
    rejected: "Rejeitado",
    cancelled: "Cancelado",
  },

  // Estados brasileiros
  STATES: [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
    "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
    "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
  ],

  // Cores para badges de status
  STATUS_COLORS: {
    active: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    available: "bg-green-100 text-green-800",
    matched: "bg-blue-100 text-blue-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    in_transit: "bg-indigo-100 text-indigo-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    maintenance: "bg-orange-100 text-orange-800",
    completed: "bg-gray-100 text-gray-800",
  },

  // Ícones SVG para tipos
  TYPE_ICONS: {
    company: "🏢",
    driver: "👤",
    load: "📦",
    route: "🛣️",
    vehicle: "🚛",
    match: "🔗",
    chat: "💬",
    notification: "🔔",
  },
};

// Impede modificação
Object.freeze(CONFIG);
