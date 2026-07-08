// ── OpenCargo — Pagination Helper ─────────────────────
// Fornece funções reutilizáveis para paginar listas de
// forma consistente em todos os endpoints GET.
//
// Uso:
//   import { getPagination, paginatedResponse } from "../common/pagination.js";
//
//   const { page, limit, offset } = getPagination(request.query);
//   const rows = await query(`SELECT * FROM ... LIMIT ? OFFSET ?`, [limit, offset]);
//   const [{ total }] = await query(`SELECT COUNT(*) as total FROM ...`);
//   return paginatedResponse(rows, total, page, limit);

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Extrai parâmetros de paginação da query string
 * @param {Object} query - request.query (fastify)
 * @returns {{ page: number, limit: number, offset: number }}
 */
export function getPagination(query = {}) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (isNaN(page) || page < 1) page = DEFAULT_PAGE;
  if (isNaN(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Envolve os dados em uma resposta paginada padronizada
 * @param {Array} data - Lista de registros da página atual
 * @param {number} total - Total de registros (sem paginação)
 * @param {number} page - Página atual
 * @param {number} limit - Itens por página
 * @returns {{ data: Array, total: number, page: number, limit: number, totalPages: number }}
 */
export function paginatedResponse(data, total, page, limit) {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Atalho para fazer query paginada simples
 * @param {Function} queryFn - Função query do banco (ex: query)
 * @param {string} baseSql - SQL sem LIMIT/OFFSET (ex: "SELECT * FROM users WHERE active = 1")
 * @param {Array} params - Parâmetros da query
 * @param {number} page - Página
 * @param {number} limit - Limite
 * @param {string} countSql - SQL de contagem (default: COUNT(*) over same base)
 * @returns {Promise<{ data: Array, total: number, page: number, limit: number, totalPages: number }>}
 */
export async function paginatedQuery(queryFn, baseSql, params = [], page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, countSql = null) {
  const { page: p, limit: l, offset } = getPagination({ page, limit });

  // Extrai a cláusula FROM + WHERE para usar na contagem
  if (!countSql) {
    // Pega tudo após o primeiro FROM
    const fromIndex = baseSql.toUpperCase().indexOf("FROM");
    const orderIndex = baseSql.toUpperCase().lastIndexOf("ORDER BY");
    const fromClause = orderIndex >= 0
      ? baseSql.slice(fromIndex, orderIndex)
      : baseSql.slice(fromIndex);
    countSql = `SELECT COUNT(*) as total ${fromClause}`;
  }

  const [rows, countResult] = await Promise.all([
    queryFn(`${baseSql} LIMIT ? OFFSET ?`, [...params, l, offset]),
    queryFn(countSql, params),
  ]);

  const total = countResult[0]?.total || 0;

  return paginatedResponse(rows, total, p, l);
}
