# OpenCargo — Contribuindo

> Guia para contribuidores do projeto OpenCargo.

---

## Como Contribuir

1. Faça um fork do repositório.
2. Crie uma branch para sua feature: `git checkout -b feat/nova-feature`
3. Commit suas mudanças: `git commit -m "feat: adiciona nova feature"`
4. Push para a branch: `git push origin feat/nova-feature`
5. Abra um Pull Request.

---

## Padrões de Código

### Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat:     nova funcionalidade
fix:      correção de bug
docs:     documentação
style:    formatação
refactor: refatoração
test:     testes
chore:    manutenção
```

### Código (Backend)

- JavaScript (ESM modules — `import`/`export`)
- Nomes de variáveis e funções em inglês
- Comentários em português quando necessário (código de negócio)
- Preferir funções puras e módulos pequenos
- Tratar erros com Zod + HTTP errors (Fastify)
- Sempre usar `await` para chamadas de banco

### Código (Frontend)

- Vanilla JavaScript modular
- Alpine.js para interatividade reativa
- Tailwind CSS para estilos (classes utilitárias)
- Leaflet para mapas

---

## Estrutura de Módulos (Backend)

Cada módulo deve conter:

```text
modulo/
├── routes.js    # Definição das rotas Fastify + Zod schemas
└── service.js   # Lógica de negócio (opcional, quando o módulo é complexo)
```

---

## Testes

O projeto utiliza o test runner nativo do Node.js (`node:test`).

```bash
# Executar todos os testes do backend
cd backend && npm test

# Executar com filtro de nome
node --test --test-name-pattern="Auth"

# Executar teste específico
node --test tests/api.test.js
```

---

## Banco de Dados

Não utilizamos ORM. As consultas SQL são escritas diretamente e executadas através do adaptador em `backend/src/common/database.js`.

```javascript
import { query, queryOne, execute } from "../common/database.js";

// SELECT
const users = query("SELECT * FROM users WHERE role = ?", ["driver"]);

// SELECT (um resultado)
const user = queryOne("SELECT * FROM users WHERE id = ?", [id]);

// INSERT / UPDATE / DELETE
execute("INSERT INTO users (id, name, email) VALUES (?, ?, ?)", [id, name, email]);
```

O adaptador suporta:
- SQLite (dev) — `node:sqlite`
- PostgreSQL (prod) — `pg` node-postgres (placeholders `?` normalizados para `$1, $2...`)

---

## Scripts Disponíveis

```bash
cd backend

npm run dev          # Servidor com hot-reload (--watch)
npm start            # Servidor de produção
npm test             # Executar testes
npm run seed         # Popular banco com dados de exemplo
npm run seed:reset   # Resetar e popular novamente
```

---

## Pull Request Checklist

- [ ] Código segue os padrões do projeto
- [ ] Testes passam (`npm test`)
- [ ] Documentação atualizada se necessário
- [ ] Nenhum segredo ou senha no código
- [ ] Branch está atualizada com a main
