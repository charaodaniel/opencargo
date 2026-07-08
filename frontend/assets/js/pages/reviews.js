/**
 * ── OpenCargo — Reviews Page ─────────────────────────
 * Página de avaliações entre empresas e motoristas.
 * Permite visualizar avaliações recebidas/dadas e criar novas.
 */

const ReviewsPage = {
  /** Modo: 'all' | 'given' | 'received' */
  _mode: "all",

  /** Lista de avaliações */
  _reviews: [],

  /** Estatísticas */
  _stats: null,

  /** Dados de matches concluídos (para avaliar) */
  _pendingMatches: [],

  /**
   * Renderiza a página
   */
  async render() {
    const user = Storage.getUser();
    if (!user) return `<div class="text-center py-16 text-gray-500">${__("message.unauthorized")}</div>`;

    await Promise.all([
      this._fetchReviews(user),
      this._fetchStats(user),
      this._fetchPendingMatches(user),
    ]);

    return this._buildHTML(user);
  },

  /**
   * Busca avaliações do usuário
   */
  async _fetchReviews(user) {
    try {
      const params = new URLSearchParams({ user_id: user.id });
      if (this._mode !== "all") params.set("role", this._mode);

      this._reviews = await Api.get(`reviews?${params.toString()}`);
    } catch {
      this._reviews = [];
    }
  },

  /**
   * Busca estatísticas do usuário
   */
  async _fetchStats(user) {
    try {
      this._stats = await Api.get(`reviews/stats/${user.id}`);
    } catch {
      this._stats = null;
    }
  },

  /**
   * Busca matches concluídos que o usuário ainda não avaliou
   */
  async _fetchPendingMatches(user) {
    try {
      const matches = await Api.get("matches");
      this._pendingMatches = matches.filter(
        (m) =>
          m.status === "completed" &&
          !this._reviews.some((r) => r.match_id === m.id && r.reviewer_id === user.id)
      );
    } catch {
      this._pendingMatches = [];
    }
  },

  /**
   * Constrói o HTML completo
   */
  _buildHTML(user) {
    return `
      <div class="fade-in max-w-4xl mx-auto space-y-6">
        <!-- Header -->
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">${__("page.reviews")}</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">${__("page.reviews.desc")}</p>
        </div>

        <!-- Stats Card -->
        ${this._stats ? this._renderStatsCard() : ""}

        <!-- Pending matches to review -->
        ${this._pendingMatches.length > 0 ? this._renderPendingCard() : ""}

        <!-- Tabs: Dadas / Recebidas / Todas -->
        <div class="flex items-center space-x-2 border-b border-gray-200 dark:border-gray-700 pb-3">
          ${["all", "given", "received"].map((mode) => `
            <button onclick="ReviewsPage.setMode('${mode}')"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                this._mode === mode
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              }">
              ${mode === "all" ? __("label.all") : mode === "given" ? __("review.given") : __("review.received")}
            </button>
          `).join("")}
        </div>

        <!-- Reviews list -->
        ${this._reviews.length === 0
          ? this._renderEmptyState()
          : this._renderReviewsList()}
      </div>
    `;
  },

  /**
   * Renderiza card de estatísticas
   */
  _renderStatsCard() {
    const avg = this._stats.average_score || 0;
    const total = this._stats.total_reviews || 0;
    const stars = Utils.renderStars(avg);

    return `
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex flex-col sm:flex-row items-center gap-6">
          <!-- Average score big -->
          <div class="text-center shrink-0">
            <div class="text-4xl font-bold text-gray-900 dark:text-white">${avg.toFixed(1)}</div>
            <div class="text-lg mt-1">${stars}</div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">${total} ${total === 1 ? __("review.review") : __("review.reviews")}</p>
          </div>

          <!-- Distribution bars -->
          <div class="flex-1 w-full space-y-1.5">
            ${[5, 4, 3, 2, 1].map((star) => {
              const count = this._stats[`${star === 5 ? "five" : star === 4 ? "four" : star === 3 ? "three" : star === 2 ? "two" : "one"}_stars`] || 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return `
                <div class="flex items-center space-x-2 text-sm">
                  <span class="w-8 text-right text-gray-600 dark:text-gray-400">${star}★</span>
                  <div class="flex-1 h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div class="h-full bg-yellow-400 rounded-full transition-all" style="width: ${pct}%"></div>
                  </div>
                  <span class="w-10 text-right text-gray-500 dark:text-gray-400 text-xs">${count}</span>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Renderiza card de matches pendentes de avaliação
   */
  _renderPendingCard() {
    return `
      <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4">
        <div class="flex items-center space-x-2 mb-3">
          <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
          </svg>
          <span class="text-sm font-medium text-amber-800 dark:text-amber-300">${__("review.pendingReviews")}</span>
        </div>
        <div class="space-y-2">
          ${this._pendingMatches.map((m) => `
            <div class="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 border border-amber-100 dark:border-amber-800/30">
              <div class="text-sm text-gray-700 dark:text-gray-300">
                <span class="font-medium">${__("review.match")} #${m.id.slice(0, 8)}</span>
              </div>
              <button onclick="ReviewsPage.openReviewForm('${m.id}')"
                class="px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
                ${__("review.rate")}
              </button>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  },

  /**
   * Renderiza lista de avaliações
   */
  _renderReviewsList() {
    return `
      <div class="space-y-3">
        ${this._reviews.map((r) => this._renderReviewCard(r)).join("")}
      </div>
    `;
  },

  /**
   * Renderiza um card de avaliação
   */
  _renderReviewCard(review) {
    const user = Storage.getUser();
    const isGiven = review.reviewer_id === user?.id;
    const stars = Utils.renderStars(review.score);

    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style="background-color: ${Utils.getAvatarColor(isGiven ? review.reviewee_name || "U" : review.reviewer_name || "U")}">
                ${Utils.getInitials(isGiven ? review.reviewee_name || "U" : review.reviewer_name || "U")}
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  ${isGiven
                    ? __("review.youRated", { name: Utils.escapeHtml(review.reviewee_name || __("label.unknown")) })
                    : __("review.ratedYou", { name: Utils.escapeHtml(review.reviewer_name || __("label.unknown")) })}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">${Utils.formatDate(review.created_at, true)}</p>
              </div>
            </div>
          </div>
          <div class="shrink-0 flex items-center space-x-2">
            <span class="text-yellow-500 text-sm">${stars}</span>
            ${isGiven ? `
              <button onclick="ReviewsPage.confirmDelete('${review.id}')"
                class="p-1 text-gray-400 hover:text-red-500 transition-colors" title="${__("action.delete")}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            ` : ""}
          </div>
        </div>
        ${review.comment ? `
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400 ml-10">${Utils.escapeHtml(review.comment)}</p>
        ` : ""}
      </div>
    `;
  },

  /**
   * Estado vazio
   */
  _renderEmptyState() {
    const labels = { all: __("review.empty.all"), given: __("review.empty.given"), received: __("review.empty.received") };
    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <div class="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">${labels[this._mode] || __("review.empty.all")}</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">${__("review.empty.desc")}</p>
      </div>
    `;
  },

  // ═══ Actions ═════════════════════════════════════

  /**
   * Altera o modo de visualização
   */
  async setMode(mode) {
    this._mode = mode;
    Router.refresh();
  },

  /**
   * Abre formulário de avaliação para um match
   */
  async openReviewForm(matchId) {
    // Busca dados do match para mostrar contexto
    const matches = await Api.get("matches");
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    Modal.openForm({
      title: __("review.newReview"),
      submitText: __("review.submit"),
      fields: [
        {
          name: "score",
          label: __("review.score"),
          type: "select",
          required: true,
          options: [
            { value: "5", label: "★★★★★ — " + __("review.excellent") },
            { value: "4", label: "★★★★☆ — " + __("review.good") },
            { value: "3", label: "★★★☆☆ — " + __("review.average") },
            { value: "2", label: "★★☆☆☆ — " + __("review.poor") },
            { value: "1", label: "★☆☆☆☆ — " + __("review.terrible") },
          ],
        },
        {
          name: "comment",
          label: __("review.comment"),
          type: "textarea",
          placeholder: __("review.commentPlaceholder"),
          required: false,
        },
      ],
      onSubmit: (data) => {
        const score = parseInt(data.score);
        const comment = data.comment || "";
        this._submitReview(matchId, score, comment);
      },
    });
  },

  /**
   * Envia avaliação para a API
   */
  async _submitReview(matchId, score, comment) {
    try {
      if (CONFIG.API_BASE_URL) {
        // Chama a API real
        const res = await fetch(`${CONFIG.API_BASE_URL}/reviews`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Storage.getToken()}`,
          },
          body: JSON.stringify({ matchId, score, comment }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || __("error.api"));
        }
      } else {
        // Mock mode
        await new Promise((r) => setTimeout(r, 300));
        console.log("[Mock] Review submitted:", { matchId, score, comment });
      }

      Modal.close();
      Toast.success(__("review.submitted"));
      Router.refresh();
    } catch (error) {
      Toast.error(error.message);
    }
  },

  /**
   * Confirma exclusão de avaliação
   */
  confirmDelete(reviewId) {
    Modal.confirm(__("review.confirmDelete"), async () => {
      try {
        if (CONFIG.API_BASE_URL) {
          await fetch(`${CONFIG.API_BASE_URL}/reviews/${reviewId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${Storage.getToken()}` },
          });
        }
        Toast.success(__("review.deleted"));
        Router.refresh();
      } catch (error) {
        Toast.error(error.message);
      }
    });
  },
};

// Adiciona helper de renderização de estrelas no Utils se não existir
if (!Utils.renderStars) {
  Utils.renderStars = (score) => {
    const full = Math.floor(score);
    const half = score % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return (
      "★".repeat(full) +
      (half ? "½" : "") +
      "☆".repeat(empty)
    );
  };
}
