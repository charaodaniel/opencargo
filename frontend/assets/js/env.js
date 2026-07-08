/**
 * ── OpenCargo — Configuração de Ambiente ──────────────
 *
 * Este arquivo contém configurações específicas do ambiente
 * (produção, homologação, etc.).
 *
 * ═══ PARA PRODUÇÃO ═══
 * Edite a variável API_BASE_URL abaixo com a URL do seu backend
 * ANTES de fazer o deploy na Vercel ou outro servidor estático.
 *
 * Exemplo:
 *   API_BASE_URL: "https://api.opencargo.com.br/api"
 *
 * Deixando vazio (""), o frontend usará dados mockados
 * (arquivos JSON locais).
 * ═══════════════════════════════════════════════════════
 */

window.__ENV__ = {
  /**
   * URL base da API REST.
   * - Vazio → usa dados mockados (JSON local)
   * - Preenchido → faz requisições reais ao backend
   */
  API_BASE_URL: "https://opencargo-production.up.railway.app/api",
};
