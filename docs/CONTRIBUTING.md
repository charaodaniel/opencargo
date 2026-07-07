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
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação
refactor: refatoração
test: testes
chore: manutenção
```

### Código

- TypeScript estrito
- Nomes em inglês para variáveis e funções
- Comentários em português quando necessário
- Preferir funções puras
- Tratar erros com Zod + HTTP errors

---

## Estrutura de Módulos

Cada módulo deve conter:

```text
modulo/
├── routes.ts    # Definição das rotas Fastify
├── service.ts   # Lógica de negócio (opcional)
└── types.ts     # Tipos específicos (opcional)
```

---

## Testes

```bash
# Executar testes do backend
cd backend && npm test

# Watch mode
npm run test:watch
```

---

## Banco de Dados

```bash
# Gerar migrations
npm run db:generate

# Aplicar migrations
npm run db:migrate
```

---

## Pull Request Checklist

- [ ] Código segue os padrões do projeto
- [ ] Testes passam
- [ ] Documentação atualizada se necessário
- [ ] Nenhum segredo ou senha no código
- [ ] Branch está atualizada com a main
