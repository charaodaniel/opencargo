/**
 * ── OpenCargo — i18n Translation Engine ──────────────
 * Sistema de internacionalização para tradução da interface.
 *
 * Uso:
 *   t("key")                    → tradução simples
 *   t("hello", { name: "João" }) → com interpolação
 *   tn("item", 5)               → pluralização
 *
 * Config:
 *   I18n.locale       → locale atual ('pt-BR' | 'en')
 *   I18n.setLocale()  → altera idioma e persiste
 *   I18n.t()          → função de tradução (atalho global __)
 */

const I18n = {
  /** Locale atual */
  locale: "pt-BR",

  /** Locales disponíveis */
  available: ["pt-BR", "en"],

  /** Labels dos locales para o seletor */
  labels: {
    "pt-BR": "Português",
    en: "English",
  },

  /** Traduções carregadas */
  _strings: {},

  /** Callbacks para quando o locale muda */
  _listeners: [],

  /**
   * Inicializa o sistema i18n
   */
  init() {
    // Carrega locale salvo
    const saved = Storage.get("locale");
    if (saved && this.available.includes(saved)) {
      this.locale = saved;
    } else {
      // Detecta locale do navegador
      const browserLang = navigator.language || navigator.languages?.[0] || "pt-BR";
      if (browserLang.startsWith("en")) {
        this.locale = "en";
      }
    }

    // Carrega as strings do locale atual
    this._loadStrings();

    // Atualiza o atributo lang no HTML
    document.documentElement.lang = this.locale;
  },

  /**
   * Carrega as strings de tradução do locale atual
   */
  _loadStrings() {
    if (this.locale === "en") {
      this._strings = I18nEn || {};
    } else {
      this._strings = I18nPtBr || {};
    }
  },

  /**
   * Altera o idioma e notifica listeners
   * @param {string} locale - 'pt-BR' | 'en'
   */
  setLocale(locale) {
    if (!this.available.includes(locale)) return;
    if (locale === this.locale) return;

    this.locale = locale;
    Storage.set("locale", locale);
    this._loadStrings();
    document.documentElement.lang = locale;

    // Notifica listeners
    this._listeners.forEach((fn) => fn(locale));
  },

  /**
   * Registra callback para mudança de idioma
   * @param {Function} fn
   */
  onChange(fn) {
    this._listeners.push(fn);
  },

  /**
   * Retorna a tradução de uma chave
   * @param {string} key - Chave no formato "section.key" ou "key"
   * @param {Object} vars - Variáveis para interpolação {{var}}
   * @returns {string}
   */
  t(key, vars = {}) {
    // Busca a string. Suporta nested keys: "nav.dashboard"
    let str = this._strings[key];
    if (!str) {
      // Tenta fallback: busca em pt-BR se estiver em en
      if (this.locale === "en" && typeof I18nPtBr !== "undefined") {
        str = I18nPtBr[key];
      }
    }
    if (!str) return key; // Fallback: mostra a própria chave

    // Interpolação: {{var}} → valor
    if (vars && Object.keys(vars).length > 0) {
      str = str.replace(/\{\{(\w+)\}\}/g, (_, v) => vars[v] ?? `{{${v}}}`);
    }

    return str;
  },

  /**
   * Pluralização simples: {0} para singular, {1} para plural
   * @param {string} key - Chave da tradução (deve ser um array [singular, plural])
   * @param {number} count - Quantidade
   * @param {Object} vars - Variáveis adicionais
   * @returns {string}
   */
  tn(key, count, vars = {}) {
    const forms = this._strings[key];
    if (Array.isArray(forms)) {
      const str = count === 1 ? forms[0] : forms[1];
      return str.replace(/\{\{count\}\}/g, count).replace(/\{\{(\w+)\}\}/g, (_, v) => vars[v] ?? `{{${v}}}`);
    }
    return this.t(key, { count, ...vars });
  },
};

// ── Atalho global ────────────────────────────────────
const __ = (key, vars) => I18n.t(key, vars);
const __n = (key, count, vars) => I18n.tn(key, count, vars);

// ── Inicializa automaticamente ───────────────────────
I18n.init();
