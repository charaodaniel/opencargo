# OpenCargo — Regras de Negócio

> Documento com as regras de negócio detalhadas do sistema.

---

## 1. Usuários

### 1.1 Tipos de Usuário

| Tipo | Descrição |
|------|-----------|
| Admin | Administrador do sistema |
| Company | Empresa que cadastra cargas |
| Driver | Motorista que transporta cargas |

### 1.2 Regras

- Todo usuário precisa de e-mail e senha para se cadastrar.
- O e-mail deve ser único no sistema.
- A senha deve ter no mínimo 6 caracteres.
- Usuários inativos não podem fazer login.

---

## 2. Empresas

### 2.1 Cadastro

- Uma empresa é vinculada a um usuário do tipo `company`.
- O documento (CNPJ) deve ser único.
- Uma empresa pode cadastrar múltiplas cargas.

---

## 3. Motoristas

### 3.1 Cadastro

- Um motorista é vinculado a um usuário do tipo `driver`.
- O documento (CPF) deve ser único.
- A CNH é obrigatória para criar rotas.

### 3.2 Disponibilidade

- O motorista pode marcar-se como disponível ou indisponível.
- Apenas motoristas disponíveis aparecem no matching.

---

## 4. Veículos

### 4.1 Capacidade

- Todo veículo possui capacidade máxima em kg e m³.
- A capacidade disponível para frete de retorno é calculada como:

```
Capacidade Disponível = Capacidade Total - Carga Atual
```

### 4.2 Regras

- Um motorista pode ter múltiplos veículos.
- A placa deve ser única no sistema.

---

## 5. Rotas

### 5.1 Rota de Ida

- Rota principal que o motorista já realizará.
- Inclui: origem, destino, datas, capacidade disponível.

### 5.2 Rota de Retorno (Backhaul)

- Rota de retorno após a entrega.
- O motorista informa que estará vazio no trajeto de volta.
- O sistema busca cargas compatíveis para ocupar esse retorno.

### 5.3 Regras

- Uma rota pode ser marcada como `isReturn = true`.
- Rotas ativas aparecem no matching.
- Rotas expiram após a data de chegada.

---

## 6. Cargas

### 6.1 Status

| Status | Descrição |
|--------|-----------|
| pending | Aguardando aprovação |
| available | Disponível para matching |
| matched | Compatível encontrado |
| in_transit | Em transporte |
| delivered | Entregue |
| cancelled | Cancelada |

### 6.2 Regras

- Apenas cargas com status `available` entram no matching.
- Uma carga pode ser cancelada antes de ser `matched`.
- Após `matched`, apenas o motorista ou a empresa pode cancelar.

---

## 7. Matching

### 7.1 Algoritmo MVP

O matching inicial é baseado em correspondência de cidades:

```text
Motorista informa:
  Rota: Santa Maria → Alegrete (retorno vazio)

Sistema busca cargas:
  Origem: Alegrete
  Destino: Santa Maria

Match encontrado!
```

### 7.2 Critérios de Compatibilidade

- Origem da carga = Destino da rota do motorista
- Destino da carga = Origem da rota do motorista
- Peso da carga ≤ Capacidade disponível do veículo
- Volume da carga ≤ Volume disponível do veículo
- Data da carga compatível com a data da rota

### 7.3 Status do Match

| Status | Descrição |
|--------|-----------|
| pending | Proposta enviada |
| accepted | Proposta aceita |
| rejected | Proposta rejeitada |
| cancelled | Cancelado por uma das partes |

---

## 8. Chat

- O chat só pode existir entre empresa e motorista após um match.
- Mensagens são persistidas no banco.
- Chat em tempo real via WebSocket.

---

## 9. Notificações

- Notificações são geradas para:
  - Novo match encontrado
  - Match aceito/rejeitado
  - Mensagem recebida
  - Carga entregue

---

## 10. Permissões

| Ação | Admin | Company | Driver |
|------|-------|---------|--------|
| Gerenciar usuários | ✅ | ❌ | ❌ |
| Cadastrar empresa | ❌ | ✅ | ❌ |
| Cadastrar motorista | ❌ | ❌ | ✅ |
| Cadastrar carga | ❌ | ✅ | ❌ |
| Cadastrar rota | ❌ | ❌ | ✅ |
| Ver matching | ✅ | ✅ | ✅ |
| Aceitar proposta | ❌ | ✅ | ✅ |
| Enviar mensagem | ❌ | ✅ | ✅ |
