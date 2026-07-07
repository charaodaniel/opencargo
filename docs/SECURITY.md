# OpenCargo — Segurança

> Documento de segurança, autenticação, autorização e boas práticas.

---

## 1. Autenticação

### 1.1 JWT (JSON Web Token)

- Tokens JWT são utilizados para autenticação stateless.
- O token deve ser enviado no header `Authorization: Bearer <token>`.
- Tempo de expiração padrão: 7 dias.
- O segredo JWT é configurado via variável de ambiente `JWT_SECRET`.

### 1.2 Hash de Senhas

- Senhas são armazenadas utilizando bcrypt com fator de custo 10.
- Nunca armazenar senhas em plain text.
- Não há recuperação de senha — apenas redefinição.

---

## 2. Autorização

### 2.1 Papéis (Roles)

| Role | Descrição |
|------|-----------|
| `admin` | Acesso total ao sistema |
| `company` | Acesso a cargas e matching |
| `driver` | Acesso a rotas e matching |

### 2.2 Controle de Acesso

- Endpoints protegidos com middleware de autenticação.
- Verificação de papel (role) para operações sensíveis.
- Usuários só podem modificar seus próprios recursos.

---

## 3. Proteção de Dados (LGPD)

### 3.1 Dados Pessoais Coletados

- Nome
- E-mail
- CPF / CNPJ
- CNH
- Telefone
- Endereço

### 3.2 Medidas

- Apenas dados essenciais para o funcionamento são coletados.
- Usuários podem solicitar exclusão de seus dados.
- Dados sensíveis (senhas) são armazenados com hash.
- Logs de acesso são mantidos para auditoria.

---

## 4. Rate Limiting

- Limite padrão: 100 requisições por minuto.
- Configurável via `RATE_LIMIT_MAX` e `RATE_LIMIT_WINDOW_MS`.
- Endpoints de login possuem limite mais restrito.

---

## 5. CORS

- Origem permitida configurada via `CORS_ORIGIN`.
- Em produção, restringir à origem do frontend.

---

## 6. Headers de Segurança (Nginx)

```nginx
# Configuração recomendada para produção
add_header X-Frame-Options "DENY";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
add_header Referrer-Policy "strict-origin-when-cross-origin";
```

---

## 7. Banco de Dados

### SQLite (Desenvolvimento)

- Arquivo .db armazenado em `backend/data/`.
- Listado no `.gitignore`.
- WAL mode para melhor performance.

### PostgreSQL (Produção)

- Conexão via URL com SSL.
- Usuário dedicado para a aplicação.
- Firewall restrito ao IP do servidor.

---

## 8. Checklist de Segurança para Produção

- [ ] `JWT_SECRET` forte e exclusivo
- [ ] HTTPS configurado
- [ ] CORS restrito
- [ ] Rate limiting ativo
- [ ] Headers de segurança no Nginx
- [ ] Logs de auditoria ativos
- [ ] Backup automático do banco
- [ ] Senhas fortes para todos os serviços
