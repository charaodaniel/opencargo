# OpenCargo — Mapeamento Completo da Interface

> Documento de referência de toda a interface do usuário, organizado por componentes, páginas, formulários, menus e botões.

---

## Sumário

1. [Layout Global](#1-layout-global)
2. [Componentes Compartilhados](#2-componentes-compartilhados)
3. [Sidebar — Navegação Principal](#3-sidebar--navegação-principal)
4. [Navbar — Barra Superior](#4-navbar--barra-superior)
5. [Landing Page (Visitantes)](#5-landing-page-visitantes)
6. [Página de Login/Registro](#6-página-de-loginregistro)
7. [Dashboard](#7-dashboard)
8. [CRUDs — Gestão](#8-cruds--gestão)
9. [Matching](#9-matching)
10. [Chat](#10-chat)
11. [Mapa Interativo](#11-mapa-interativo)
12. [Histórico de Fretes](#12-histórico-de-fretes)
13. [Notificações](#13-notificações)
14. [Avaliações](#14-avaliações)
15. [Documentos](#15-documentos)
16. [Perfil do Usuário](#16-perfil-do-usuário)
17. [Configurações](#17-configurações)
18. [Logs e Auditoria](#18-logs-e-auditoria)
19. [Admin — Usuários](#19-admin--usuários)
20. [Painel da Empresa](#20-painel-da-empresa)
21. [Documentação Integrada](#21-documentação-integrada)
22. [Alertas de Segurança](#22-alertas-de-segurança)
23. [Ordem de Serviço](#23-ordem-de-serviço)
24. [Modo Offline / PWA](#24-modo-offline--pwa)
25. [Tabela de Rotas e Permissões](#25-tabela-de-rotas-e-permissões)

---

## 1. Layout Global

```
┌──────────────────────────────────────────────────┐
│  Sidebar (esquerda, fixa)  │   Navbar (topo)     │
│                            ├──────────────────────┤
│  ┌─ Gestão ─────────┐     │                      │
│  │ Dashboard        │     │   MAIN CONTENT       │
│  │ Empresas         │     │   (Router)           │
│  │ Motoristas       │     │                      │
│  │ Veículos         │     │                      │
│  ├─ Operações ──────┤     │                      │
│  │ Rotas            │     │                      │
│  │ Cargas           │     │                      │
│  │ Matching         │     │                      │
│  │ Documentos       │     │                      │
│  │ Histórico        │     │                      │
│  ├─ Comunicação ───┤     │                      │
│  │ Mapa             │     │                      │
│  │ Chat             │     │                      │
│  │ Avaliações       │     │                      │
│  │ Notificações     │     │                      │
│  │ Alertas          │     │                      │
│  │ Auditoria        │     │                      │
│  ├─ Conta ─────────┤     │                      │
│  │ Painel Empresa  │     │                      │
│  │ Documentação    │     │                      │
│  │ Configurações   │     │                      │
│  │ Perfil          │     │                      │
│  └─────────────────┘     │                      │
└──────────────────────────┴──────────────────────┘
```

### Elementos do Layout

| Elemento | Descrição | Visível |
|----------|-----------|---------|
| **Splash Screen** | Animação de carregamento inicial com logo pulsante e barra de progresso | Antes do `App.initialize()` |
| **Sidebar** | Navegação principal com sub-menus colapsáveis | Desktop fixa, mobile toggle |
| **Navbar** | Barra superior com ações rápidas, notificações, tema, idioma, perfil | Sempre (logado) |
| **Main Content** | Container dinâmico gerenciado pelo Router | Sempre |
| **Toast Container** | Notificações flutuantes no canto inferior direito | Quando acionado |
| **Modal Backdrop** | Overlay escuro com blur para modais | Quando aberto |
| **Scroll Progress Bar** | Barra no topo da navbar indicando progresso de scroll | Logado |
| **Update Banner** | Banner azul no topo informando nova versão PWA disponível | Quando SW atualiza |

---

## 2. Componentes Compartilhados

### 2.1 Toast (`Toast`)

**Posição:** `fixed bottom-6 right-6 z-50`

**Estrutura:** Container com toasts empilhados verticalmente.

**Tipos e cores:**

| Tipo | Cor | Ícone |
|------|-----|-------|
| `success` | `bg-green-600` | ✅ Check |
| `error` | `bg-red-600` | ❌ X |
| `warning` | `bg-yellow-500` | ⚠️ Warning |
| `info` | `bg-blue-600` | ℹ️ Info |

**Comportamento:**
- Aparece com slide-in da direita
- Auto-dismiss após `CONFIG.TOAST_DURATION` (3500ms)
- Botão X para dismiss manual
- Animação de saída com slide-out

**API:**
```js
Toast.success("Mensagem")
Toast.error("Mensagem")
Toast.warning("Mensagem")
Toast.info("Mensagem")
```

---

### 2.2 Modal (`Modal`)

**Estrutura:**
```
┌─────────────────────────────────────┐
│  Título do Modal          [×]      │ ← Header
├─────────────────────────────────────┤
│                                     │
│  Conteúdo (body)                   │ ← Body
│                                     │
├─────────────────────────────────────┤
│  [Cancelar]          [Confirmar]   │ ← Footer
└─────────────────────────────────────┘
```

**Propriedades:**
- Largura máxima: `max-w-lg` (32rem)
- Altura máxima: `max-h-[85vh]` com scroll
- Fundo: `bg-white` / `dark:bg-gray-800`
- Backdrop: `bg-black/50 backdrop-blur-sm`
- Animação: scale-in + fade-in

**Modos de uso:**

| Método | Uso | Botões |
|--------|-----|--------|
| `Modal.open()` | Conteúdo customizado | Customizável via footer |
| `Modal.openForm()` | Formulário com campos | Cancelar + Salvar |
| `Modal.confirm()` | Diálogo de confirmação | Cancelar + Confirmar (red) |

**Tipos de campo suportados no `openForm()`:**

| Tipo | HTML | Exemplo |
|------|------|---------|
| `text` | `<input type="text">` | Nome, telefone |
| `number` | `<input type="number">` | Peso, ano |
| `date` | `<input type="date">` | Data de coleta |
| `select` | `<select>` | Tipo de carga, status |
| `textarea` | `<textarea>` | Descrição |
| `autocomplete="city"` | Input + Nominatim | Cidade com autocomplete |

---

### 2.3 Table (`Table`)

**Estrutura:**
```
┌──────────────────────────────────────────────┐
│  Nome          Cidade      Status    Ações   │ ← Thead
├──────────────────────────────────────────────┤
│  João         São Paulo    Ativo    [✏️][🗑️] │ ← Tbody
│  Maria        Campinas     Inativo  [✏️][🗑️] │
└──────────────────────────────────────────────┘
```

**Propriedades:**
- Header com `bg-gray-50` / `dark:bg-gray-700/50`
- Rows alternadas
- Hover: `hover:bg-gray-50` / `dark:hover:bg-gray-700/50`
- Estado vazio com ilustração SVG e mensagem
- Overflow horizontal em telas pequenas

**Métodos auxiliares:**

| Método | Descrição |
|--------|-----------|
| `Table.statusBadge(status)` | Badge de status (ex: Pendente, Ativo, Entregue) |
| `Table.actions({ onView, onEdit, onDelete })` | Botões de ação (👁️✏️🗑️) |
| `Table.searchInput(placeholder)` | Campo de busca com lupa |

---

### 2.4 Card (`Card`)

| Método | Descrição | Uso |
|--------|-----------|-----|
| `Card.stat({ title, value, icon, color })` | Card de estatística | Dashboard |
| `Card.info({ title, children, headerRight })` | Card informativo | Perfil, detalhes |
| `Card.infoGrid(items, cols)` | Grid de pares label:value | Detalhes de entidades |
| `Card.skeleton(count)` | Skeleton loading animado | Carregamento |

**Cores disponíveis para `Card.stat()`:** `blue`, `green`, `purple`, `amber`, `red`, `indigo`

---

### 2.5 Ícones (`Icons`)

Biblioteca de ícones SVG no estilo Heroicons Outline. Todos os ícones são funções que aceitam `{ class, color, noHover }`.

| Ícone | Função | Descrição |
|-------|--------|-----------|
| 📦 | `Icons.package()` | Carga/pacote |
| 🛣️ | `Icons.route()` | Rota/estrada |
| 🔗 | `Icons.link()` | Link/match |
| 💬 | `Icons.chat()` | Chat/balão |
| 🔔 | `Icons.bell()` | Notificação/sino |
| 🚛 | `Icons.truck()` | Caminhão |
| ✅ | `Icons.check()` | Check verde |
| ℹ️ | `Icons.info()` | Info círculo |
| 👤 | `Icons.user()` | Usuário |
| 🏢 | `Icons.building()` | Empresa/prédio |
| 📄 | `Icons.document()` | Documento |
| 📝 | `Icons.edit()` | Editar/lápis |
| 📊 | `Icons.chart()` | Gráfico/barras |
| 🗺️ | `Icons.map()` | Mapa |
| 🔄 | `Icons.refresh()` | Recarregar/sync |
| ⭐ | `Icons.star()` | Estrela/admin |
| 🔍 | `Icons.search()` | Busca/lupa |
| ➕ | `Icons.plus()` | Adicionar |
| 🗑️ | `Icons.trash()` | Deletar/lixeira |
| ❤️ | `Icons.heart()` | Coração |
| ☀️ | `Icons.sun()` | Sol/claro |
| 🌙 | `Icons.moon()` | Lua/escuro |
| 📍 | `Icons.pin()` | Pin/localização |
| ⚖️ | `Icons.weight()` | Peso/balança |
| 📅 | `Icons.calendar()` | Calendário |
| 🖥️ | `Icons.server()` | Servidor/host |
| 🚀 | `Icons.rocket()` | Foguete |
| 💰 | `Icons.currency()` | Dinheiro |
| 🛡️ | `Icons.shield()` | Shield/proteção |

---

## 3. Sidebar — Navegação Principal

### 3.1 Grupos e Itens

A sidebar é dividida em **4 grupos** com sub-menus colapsáveis:

#### Gestão
| Ícone | Label | Página | Roles |
|-------|-------|--------|-------|
| 🏠 | Dashboard | `dashboard` | Todos |
| 🏢 | Empresas | `companies` | Todos |
| 👤 | Motoristas | `drivers` | Todos |
| 🚛 | Veículos | `vehicles` | Todos |

#### Operações
| Ícone | Label | Página | Roles |
|-------|-------|--------|-------|
| 🛣️ | Rotas | `routes` | Todos |
| 📦 | Cargas | `loads` | Todos |
| 🔗 | Matching | `matching` | Todos |
| 📄 | Documentos | `documents` | Todos |
| 📋 | Histórico | `logs` | Todos |

#### Comunicação
| Ícone | Label | Página | Roles |
|-------|-------|--------|-------|
| 🗺️ | Mapa | `maps` | Todos |
| 💬 | Chat | `chat` | Todos |
| ⭐ | Avaliações | `reviews` | Todos |
| 🔔 | Notificações | `notifications` | Todos |
| ⚠️ | Alertas | `alerts` | Admin apenas |
| 📊 | Auditoria | `audit` | Admin apenas |

#### Conta
| Ícone | Label | Página | Roles |
|-------|-------|--------|-------|
| 🏢 | Painel Empresa | `company` | Empresa/Company |
| 👑 | Admin | `admin-users` | Admin apenas |
| 📖 | Documentação | `docs` | Todos |
| ⚙️ | Configurações | `settings` | Todos |
| 👤 | Perfil | `profile` | Todos |

### 3.2 Estados da Sidebar

| Estado | Descrição | Largura |
|--------|-----------|---------|
| **Expandida** (desktop) | Mostra ícones + labels + grupo aberto | `w-64` (16rem) |
| **Colapsada** (desktop) | Apenas ícones, com tooltips | `w-16` (4rem) |
| **Mobile** | Overlay translúcido + sidebar slide-in | `w-64` com `-translate-x-full` |

### 3.3 Botões da Sidebar

| Botão | Ação | Visível |
|-------|------|---------|
| Chevron ▾ no grupo | Abre/fecha sub-menu | Expandido |
| Item de menu | `Router.go(page)` | Sempre |
| Botão toggle colapso (`◀`/`▶`) | Alterna expandido/colapsado | Desktop |
| Overlay (clique fora) | Fecha sidebar | Mobile |

---

## 4. Navbar — Barra Superior

### 4.1 Elementos (da esquerda para a direita)

```
[Mobile menu ☰] [Logo OpenCargo]                    [Offline] [🌐] [🔔] [🌙] [👤 Nome ▾]
```

### 4.2 Itens Detalhados

| Elemento | Ícone | Função | Comportamento |
|----------|-------|--------|---------------|
| **Mobile Menu** | `☰` (três linhas) | Abre/fecha sidebar | Apenas mobile (`lg:hidden`) |
| **Logo** | Logo 192px | Navega para Dashboard | Apenas mobile |
| **Offline Indicator** | 🔄 sincronizar + badge | Exibe ações pendentes na fila offline | Hidden se online. Badge laranja com contagem |
| **Idioma** | 🇧🇷/🇺🇸 | Alterna entre pt-BR e EN | Dropdown com PT e EN. Recarrega página ao trocar |
| **Notificações** | 🔔 (sino) + badge | Abre dropdown com últimas 5 notificações | Badge vermelho se não lidas. Dropdown 80rem |
| **Tema** | 🌙/☀️ | Alterna claro/escuro | Animação de rotação no ícone |
| **Perfil** | Avatar + nome + role | Abre dropdown do usuário | Avatar com iniciais + cor única |

### 4.3 Dropdown do Usuário

```
┌────────────────────────────────┐
│  Nome do Usuário               │
│  email@usuario.com             │
├────────────────────────────────┤
│  👤 Perfil                     │ → Router.go('settings')
│  ⚙️ Configurações              │ → Router.go('settings')
├────────────────────────────────┤
│  🚪 Sair (vermelho)            │ → Modal.confirm → logout
└────────────────────────────────┘
```

### 4.4 Dropdown de Notificações

```
┌──────────────────────────────────────────┐
│  Notificações          [Marcar todas]    │
├──────────────────────────────────────────┤
│  [🔗] Match: Carga SP→RJ     ● (azul)   │ ← Não lida
│       João aceitou o match               │
│       10 min atrás                       │
├──────────────────────────────────────────┤
│  [💬] Mensagem: Maria                   │ ← Lida
│       "Ok, confirmado!"                  │
│       1 hora atrás                       │
├──────────────────────────────────────────┤
│  [ℹ️] Sistema: Conta criada              │
│       Bem-vindo ao OpenCargo!            │
├──────────────────────────────────────────┤
│           Ver todas →                    │
└──────────────────────────────────────────┘
```

### 4.5 Barra de Progresso de Scroll

Barra horizontal fina (`h-0.5`) no topo da navbar, com gradiente `from-blue-500 via-indigo-500 to-purple-500`. A largura aumenta conforme o scroll da página.

---

## 5. Landing Page (Visitantes)

### 5.1 Seções

| Seção | Descrição |
|-------|-----------|
| **Navbar** | Links: Funcionalidades, Como Funciona, Preços, GitHub. Botões: Entrar, Começar Grátis |
| **Hero** | Título com gradiente, subtítulo, 2 CTAs, social proof (avatars + 200 transportadoras) |
| **Cargas Disponíveis** | Vitrine BlaBlaCar — cards com origem→destino, peso, tipo, botão "Entrar para Aceitar" (→ login) |
| **Trusted By** | Marcas fictícias (LogTech, FreteBrasil, etc.) |
| **Features** | 6 cards: Matching, Chat, Mapa, Autenticação, Dashboard, Self-Hosted |
| **How It Works** | 4 passos numerados com linha conectora |
| **Stats** | Fundo gradiente azul-roxo, contadores animados: 100% Open Source, 38 Testes, 9 Tabelas, 0 APIs Pagas |
| **Testimonials** | 3 depoimentos com estrelas e avatares |
| **CTA Final** | Fundo gradiente, "Criar Conta Gratuita" + "Ver no GitHub" |
| **Footer** | Logo, descrição, links: Produto, Dev, Stack. MIT License |

### 5.2 Botões da Landing Page

| Botão | Ação | Estilo |
|-------|------|--------|
| Entrar | `Router.go('login')` | Texto simples, hover azul |
| Começar Grátis | `Router.go('login')` | Azul `bg-blue-600`, shadow, hover sobe |
| Entrar para Aceitar | `Router.go('login')` | Gradiente verde `from-green-500 to-emerald-600` |
| Ver todas as cargas | `Router.go('login')` | Borda cinza, hover verde |
| Ver Funcionalidades | Scroll suave para `#features` | Borda cinza, hover azul |
| Criar Conta Gratuita | `Router.go('login')` | Branco texto azul, shadow |
| Ver no GitHub | Abre https://github.com/charaodaniel/opencargo | Transparente com borda |

---

## 6. Página de Login/Registro

### 6.1 Login

```
┌──────────────────────────────────────┐
│                                      │
│  [Logo OpenCargo]                    │
│  Bem-vindo de volta                  │
│  Entre com suas credenciais          │
│                                      │
│  E-mail                              │
│  ┌──────────────────────────────────┐│
│  │ seu@email.com                    ││
│  └──────────────────────────────────┘│
│                                      │
│  Senha                               │
│  ┌──────────────────────────────────┐│
│  │ •••••••••••                      ││
│  └──────────────────────────────────┘│
│                                      │
│  ┌──────────────────────────────┐    │
│  │         ENTRAR               │    │
│  └──────────────────────────────┘    │
│                                      │
│  Não tem conta? Cadastre-se          │
│                                      │
└──────────────────────────────────────┘
```

### 6.2 Registro

Mesmo layout do login, com campos adicionais:

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| Nome completo | `text` | ✅ |
| E-mail | `email` | ✅ |
| Senha | `password` (min 6) | ✅ |
| Tipo de conta | `select` (Empresa / Motorista) | ✅ |

### 6.3 Validação

- E-mail: formato válido
- Senha: mínimo 6 caracteres
- Nome: não vazio
- Feedback: toast de erro ou sucesso

---

## 7. Dashboard

### 7.1 Estrutura

```
┌──────────────────────────────────────────────┐
│  Dashboard                 [data atual]      │
│  Visão geral do sistema                      │
├──────────────────────────────────────────────┤
│  [Empresas Ativas][Motoristas Disp.][Cargas] │
│  [Rotas Ativas] [Matches Pend.] [Entregues]  │
├──────────────────┬───────────────────────────┤
│  Status Cargas   │ Distribuição Usuários     │
│  (Chart.js bar)  │ (Chart.js doughnut)       │
├──────────────────┴───────────────────────────┤
│  Ações Rápidas   │  Atividade Recente        │
│  - Nova Carga    │  Match: Carga X           │
│  - Nova Rota     │  João - Pendente          │
│  - Matching      │                           │
│  - Chat          │                           │
└──────────────────────────────────────────────┘
```

### 7.2 Cards de Estatística (6 cards)

| Card | Ícone | Cor |
|------|-------|-----|
| Empresas Ativas | 🏢 | Blue |
| Motoristas Disponíveis | 👤 | Verde |
| Cargas Disponíveis | 📦 | Roxo |
| Rotas Ativas | 🛣️ | Âmbar |
| Matches Pendentes | 📈 | Vermelho |
| Entregas Realizadas | ✅ | Verde |

### 7.3 Gráficos

| Gráfico | Tipo | Dados |
|---------|------|-------|
| Status das Cargas | Barra (Chart.js) | Pendente, Disponível, Match, Em Trânsito, Entregue, Cancelado |
| Distribuição de Usuários | Doughnut (Chart.js) | Admin, Gestor, Empresa, Motorista |

### 7.4 Ações Rápidas

| Ação | Ícone | Navega |
|------|-------|--------|
| Nova Carga | 📦 `Icons.package()` | `Router.go('loads')` |
| Nova Rota | 🛣️ `Icons.route()` | `Router.go('routes')` |
| Ver Matching | 🔗 `Icons.link()` | `Router.go('matching')` |
| Chat | 💬 `Icons.chat()` | `Router.go('chat')` |

---

## 8. CRUDs — Gestão

Todas as páginas de CRUD seguem o mesmo padrão:

### 8.1 Estrutura Comum

```
┌──────────────────────────────────────────────┐
│  Título da Página        [+ Novo Botão]      │
│  Descrição da página     [Exportar CSV]      │
├──────────────────────────────────────────────┤
│  Cards de filtro: [Todas] [Ativas] [Inativas]│
├──────────────────────────────────────────────┤
│  Tabela com dados                            │
│  ┌──────┬──────┬──────┬──────┬──────────┐   │
│  │ Nome │Cidade│Status│Fone  │  Ações   │   │
│  ├──────┼──────┼──────┼──────┼──────────┤   │
│  │ ...  │ ...  │ ...  │ ...  │ [✏️][🗑️] │   │
│  └──────┴──────┴──────┴──────┴──────────┘   │
└──────────────────────────────────────────────┘
```

### 8.2 Páginas CRUD

| Página | Entidade | Campos do Formulário | Filtros |
|--------|----------|----------------------|---------|
| **Empresas** | Company | Nome, CNPJ, Endereço, Cidade, UF, Telefone | Todas, Ativas, Inativas |
| **Motoristas** | Driver | Nome, CPF, CNH, Telefone, Cidade, UF | Todos, Disponíveis, Indisponíveis |
| **Veículos** | Vehicle | Placa, Modelo, Ano, Capacidade (kg), Volume (m³), Tipo (Truck/Carreta/Van/Baú), Status | Todos, Ativos, Manutenção, Inativos |
| **Rotas** | Route | Cidade Origem (autocomplete), UF Origem, Cidade Destino (autocomplete), UF Destino, Partida, Chegada, Peso Disponível, Volume Disponível, É Retorno | Todas, Ativas, Retorno, Concluídas, Canceladas |
| **Cargas** | Load | Título, Descrição, Cidade Origem (autocomplete), UF Origem, Cidade Destino (autocomplete), UF Destino, Peso (kg), Volume (m³), Tipo (select), Coleta, Entrega | Todas, Pendentes, Disponíveis, Match, Em Trânsito, Entregues, Canceladas |

### 8.3 Botões de Ação (todas as CRUDs)

| Botão | Posição | Ação |
|-------|---------|------|
| `+ Novo` | Topo direita | Abre `Modal.openForm()` para criar |
| `Exportar CSV` | Topo direita | Baixa CSV dos dados filtrados |
| ✏️ Editar | Coluna Ações | Abre `Modal.openForm()` para editar |
| 🗑️ Excluir | Coluna Ações | `Modal.confirm()` → `Api.delete()` |
| Cards de filtro | Topo | Filtra a tabela por status/estado |

### 8.4 Validadores de Formulário

- **Rotas e Cargas:** Autocomplete de cidades via Nominatim (integração com Geocoding)
- **Veículos:** Select para tipo (Truck, Carreta, Van, Baú) e status
- **Cargas:** Select para tipo de carga (Geral, Frágil, Frigorífica, Perigosa, Granel)
- **Todos:** Campos numéricos têm `min` e `step` configurados

---

## 9. Matching

### 9.1 Estrutura

```
┌──────────────────────────────────────────────┐
│  Matching                    [N resultados]  │
│  Encontre cargas e motoristas compatíveis    │
├──────────────────────────────────────────────┤
│  [📦 Cargas p/ Motoristas] [🚛 Motoristas]   │
├──────────────────────────────────────────────┤
│  📍 Cargas perto de mim                     │
│  [Buscar perto] [Cidade] [UF] [Km]         │
├──────────────────────────────────────────────┤
│  Filtros Avançados                          │
│  Busca │ UF Orig │ UF Dest │ Tipo Carga     │
│  Peso Min │ Peso Max │ Data Início │ Data Fim│
│  Período [Hoje][Semana][Mês]                │
│  Score Min │ Ordenar por │ Ordem             │
│  [Limpar filtros]                           │
├──────────────────────────────────────────────┤
│  Chips de filtros ativos                    │
├──────────────────────────────────────────────┤
│  Resultados (cards)                         │
│  ┌────────────────────────────────────────┐ │
│  │ [75%] Título da Carga                  │ │
│  │       São Paulo/SP → Porto Alegre/RS  │ │
│  │  500 kg · 10 m³ · 2026-07-10 · Geral   │ │
│  │  Rota: João - SP→RS - Caminhão         │ │
│  │  ✓ Rota direta ✓ Peso compatível       │ │
│  │  [💬 Chat] [📎 Anexar doc] [➕ Match]  │ │
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### 9.2 Scores

| Score | Cor do Círculo | Significado |
|-------|----------------|-------------|
| ≥ 75% | Verde | Alta compatibilidade |
| ≥ 50% | Amarelo | Média compatibilidade |
| ≥ 25% | Laranja | Baixa compatibilidade |
| < 25% | Cinza | Mínima compatibilidade |

### 9.3 Botões por Estado do Match

| Estado do Match | Botões Disponíveis |
|-----------------|-------------------|
| **Sem match** | 💬 Chat, 📎 Anexar doc, ➕ Criar Match, (Criar OS desabilitado) |
| **Pendente** | ⏳ Aguardando confirmação, ✅ Confirmar Viagem, 💬 Chat, (Criar OS desabilitado) |
| **Confirmado** | ✅ Viagem Confirmada, 💬 Chat, 📎 Anexar doc, 📄 Criar OS |
| **Desconhecido** | 💬 Chat |

### 9.4 Busca por Proximidade

- Usa GPS do navegador (`navigator.geolocation`)
- Fallback para cidade manual
- Campo de raio em km (default 150)
- Endpoint: `GET /api/loads/nearby?lat=&lng=&radius=`
- Resultados mostrados com score baseado em distância

---

## 10. Chat

### 10.1 Estrutura (WhatsApp-like)

```
┌────────────────────────────────────────────────────────┐
│  Conversas                          │                   │
├──────────────────────────────────────┤                   │
│  ┌─────────────────────┐            │                   │
│  │ [Avatar] João        │            │  Selecione uma    │
│  │         Carga SP→RJ  │            │  conversa         │
│  │         [Pendente]   │            │                   │
│  ├─────────────────────┤            │                   │
│  │ [Avatar] Maria       │            │                   │
│  │         Carga BH→CT  │            │                   │
│  │         [Aceito]     │            │                   │
│  └─────────────────────┘            │                   │
│                                      │                   │
└──────────────────────────────────────┴───────────────────┘
```

### 10.2 Quando uma conversa está selecionada

```
┌────────────────────────────────────────────────────────┐
│  Conversas                          │                   │
├──────────────────────────────────────┤                   │
│  [Avatar] João            ← ativo   │  ┌─────────────┐  │
│  [Avatar] Maria                      │  │ Olá, tudo   │  │
│                                      │  │ bem?        │  │
│                                      │  └─────────────┘  │
│                                      │  ┌──────────────┐ │
│                                      │  │ Tudo certo!  │ │
│                                      │  │ Confirma     │ │
│                                      │  │ viagem?     │ │
│                                      │  └──────────────┘ │
│                                      │                   │
│                                      │  [Digite...][➤]   │
└──────────────────────────────────────┴───────────────────┘
```

### 10.3 Elementos

| Elemento | Descrição |
|----------|-----------|
| Sidebar de conversas | `w-72`, lista de matches ativos (pending/accepted) |
| Avatar | Iniciais + cor por nome |
| Badge de status | Pendente (amarelo), Aceito (verde) |
| Mensagens próprias | Alinhadas à direita, `bg-blue-600 text-white` |
| Mensagens do outro | Alinhadas à esquerda, `bg-gray-100 dark:bg-gray-700` |
| Input | `flex-1` com placeholder "Digite sua mensagem..." |
| Botão enviar | Ícone de avião de papel, `bg-blue-600` |

---

## 11. Mapa Interativo

### 11.1 Estrutura

```
┌────────────────────────────────────────────────────────┐
│  🗺️ Mapa de Rotas                                      │
│  [Buscar cidade...] [Rotas Ativas] [Concluídas] [Cargas]│
├──────────────────────────────────┬─────────────────────┤
│                                  │  Legenda             │
│          MAPA LEAFLET            │  ─ Ativa (azul)      │
│                                  │  ─ Concluída (cinza) │
│                                  │  ─ Cancelada (vermelha)│
│                                  │  ● Origem (azul)     │
│                                  │  ● Destino (vermelho)│
│                                  │  ● Carga (âmbar)     │
│                                  │                      │
│                                  │  Estatísticas        │
│                                  │  Total Rotas: 12     │
│                                  │  Ativas: 8           │
│                                  │  Concluídas: 3       │
│                                  │  Retorno: 2          │
│                                  │  Cargas: 7           │
│                                  │  Cidades: 10         │
│                                  │                      │
│                                  │  Rotas               │
│                                  │  • SP → POA          │
│                                  │  • CT → RJ           │
│                                  │  • ...               │
└──────────────────────────────────┴─────────────────────┘
```

### 11.2 Camadas do Mapa

| Camada | Descrição | Ícone/Cor | Agrupamento |
|--------|-----------|-----------|-------------|
| **Rotas Ativas** | Polylines azuis (`#3B82F6`) | 3px sólido (retorno: tracejado) | `L.featureGroup` |
| **Rotas Concluídas** | Polylines cinza (`#9CA3AF`) | 2.5px sólido | `L.featureGroup` |
| **Rotas Canceladas** | Polylines vermelha (`#F87171`) | 2px tracejado | `L.featureGroup` |
| **Cargas** | Marcadores âmbar com ícone de pacote | `L.markerClusterGroup` | Clusterizado |
| **Cidades** | Pontos roxos pequenos | `L.markerClusterGroup` | Clusterizado |

### 11.3 Popups

**Popup de Rota:**
```
┌─────────────────────────────┐
│  São Paulo → Porto Alegre   │
│  Motorista: João Silva      │
│  Data: 2026-07-10 → 15      │
│  Capacidade: 5000 kg · 30 m³│
│  [Ativa] [Retorno]          │
└─────────────────────────────┘
```

**Popup de Carga:**
```
┌─────────────────────────────┐
│  Eletrônicos POA            │
│  Empresa: Transportadora ABC│
│  Origem: SP → Destino: POA  │
│  Peso: 500 kg · Vol: 10 m³  │
│  Coleta: 2026-07-10         │
│  [Disponível]               │
└─────────────────────────────┘
```

### 11.4 Geocoding / Busca de Cidades

- Input com autocomplete via Nominatim
- Ao selecionar: mapa voa para a cidade (`map.flyTo`)
- Marcador temporário com popup
- Remove ao clicar no mapa

---

## 12. Histórico de Fretes

### 12.1 Estrutura

```
┌──────────────────────────────────────────────┐
│  Histórico de Fretes          [Exportar CSV] │
│  Acompanhe todos os fretes                   │
├──────────────────────────────────────────────┤
│  [Total: 12] [Concluídos: 5] [Andamento: 3] │
│  [Cancelados: 2]                             │
├──────────────────────────────────────────────┤
│  [Todos] [Concluídos] [Andamento] [Pendentes]│
│  Período: [Hoje][Semana][Mês]               │
├──────────────────────────────────────────────┤
│  Filtros: [Busca...] [Status] [Data] [Data] │
├──────────────────────────────────────────────┤
│  Cards de frete                              │
│  ┌────────────────────────────────────────┐ │
│  │ [Entregue]          Score: 85%         │ │
│  │                                        │ │
│  │ Carga: Eletrônicos      Motorista: João│ │
│  │ SP/SP → POA/RS         Empresa: ABC    │ │
│  │ 500 kg · Carga Geral                   │ │
│  │                                        │ │
│  │ 📅 Coleta: 10/07  📍 Entrega: 15/07   │ │
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### 12.2 Detalhes do Card de Frete (3 colunas)

| Coluna | Campos |
|--------|--------|
| **Carga** | Título, Origem→Destino, Peso, Tipo |
| **Motorista** | Nome, Cidade, Avaliação (estrelas), Veículo |
| **Empresa** | Nome, Cidade, Avaliação |

---

## 13. Notificações

### 13.1 Estrutura

```
┌──────────────────────────────────────────────┐
│  Notificações              [Marcar todas]    │
│  Suas notificações e alertas                 │
├──────────────────────────────────────────────┤
│  [Todas (12)] [Não Lidas (3)] [Matches]     │
│  [Mensagens] [Sistema]                      │
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐ │
│  │ [🔗] Match: Eletrônicos POA      ●    │ │ (não lida)
│  │ João Silva aceitou o match            │ │
│  │ 10 min atrás              [Ler]      │ │
│  ├────────────────────────────────────────┤ │
│  │ [💬] Mensagem de Maria                 │ │ (lida)
│  │ "Ok, confirmado!"                     │ │
│  │ 1 hora atrás                          │ │
│  ├────────────────────────────────────────┤ │
│  │ [ℹ️] Conta criada com sucesso         │ │
│  │ Bem-vindo ao OpenCargo!               │ │
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### 13.2 Tipos de Notificação

| Tipo | Ícone | Cor |
|------|-------|-----|
| `match` | 🔗 Link | Azul |
| `message` | 💬 Chat | Verde |
| `system` | ℹ️ Info | Âmbar |

---

## 14. Avaliações

### 14.1 Estrutura

```
┌──────────────────────────────────────────────┐
│  Avaliações                  [Exportar CSV]  │
├──────────────────────────────────────────────┤
│  4.2 ★★★★½                                │
│  [5★ ██████████ 12] [4★ ████ 5]           │
│  [3★ ██ 2] [2★ 0] [1★ █ 1]               │
├──────────────────────────────────────────────┤
│  ⚠️ 2 matches para avaliar                  │
│  [Match #abc12345] [Avaliar]               │
├──────────────────────────────────────────────┤
│  [Todas] [Dadas] [Recebidas]                │
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐ │
│  │ [AL] Você avaliou Ana Lúcia   ★★★★★  │ │
│  │     12/07/2026                        │ │
│  │ "Ótima parceria, pontual!"            │ │
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### 14.2 Botões e Ações

| Elemento | Ação |
|----------|------|
| `[Todas] [Dadas] [Recebidas]` | Filtra lista |
| `[Avaliar]` | Abre `Modal.openForm()` com score (1-5) + comentário |
| 🗑️ (na própria avaliação) | `Modal.confirm()` → `DELETE /api/reviews` |

---

## 15. Documentos

### 15.1 Estrutura

```
┌──────────────────────────────────────────────┐
│  Documentos                   [+ Upload]     │
│  Gerencie seus documentos e arquivos          │
├──────────────────────────────────────────────┤
│  Categorias: [Gerais] [Empresas] [Motoristas]│
│             [Veículos] [Cargas]              │
├──────────────────────────────────────────────┤
│  Lista de documentos em grid/cards           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ 📄      │ │ 🖼️      │ │ 📄      │    │
│  │ CNH.pdf │ │ Foto.jpg │ │ NF.pdf   │    │
│  │ 2.3 MB  │ │ 1.1 MB  │ │ 580 KB  │    │
│  │ 10/07   │ │ 09/07   │ │ 08/07   │    │
│  └──────────┘ └──────────┘ └──────────┘    │
└──────────────────────────────────────────────┘
```

### 15.2 Upload

- Dropzone com clique ou arrastar
- Tipos aceitos: `PDF, imagens, DOC, XLS, TXT`
- Tamanho máximo: 10MB
- Indicador de progresso no botão

---

## 16. Perfil do Usuário

### 16.1 Estrutura

```
┌──────────────────────────────────────────────┐
│                                              │
│  ┌─── BANNER GRADIENTE AZUL ──────────────┐ │
│  │    [Avatar] Nome Completo     [Editar]  │ │
│  │             email@user.com              │ │
│  │    [👑 Admin] [📱 (11) 99999-9999]     │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  Nome completo: João Silva                  │
│  E-mail: joao@email.com                     │
│  Telefone: (11) 99999-9999                  │
│  Tipo de conta: Administrador               │
│  Membro desde: 01/01/2026                   │
│  ID: abc-123-def-456                        │
├──────────────────────────────────────────────┤
│  Avaliações                                  │
│  4.2 ★★★★☆                                 │
│  5★ ████████████████ 12                     │
│  4★ ████████ 5                              │
│  ...                                         │
├──────────────────────────────────────────────┤
│  ⚙️ Configurações →                          │
└──────────────────────────────────────────────┘
```

### 16.2 Modo de Edição

Ao clicar em "Editar", abre `Modal.openForm()` com:
- Nome completo (`text`, required)
- Telefone (`text`, placeholder: (11) 99999-9999)

---

## 17. Configurações

### 17.1 Cards

#### Tema
```
┌──────────────────────────────────────────────┐
│  🌙 Tema                                     │
│  Claro     [⛅️ Toggle Switch]     Escuro     │
└──────────────────────────────────────────────┘
```

#### Idioma
```
┌──────────────────────────────────────────────┐
│  🌐 Idioma                                   │
│  ┌──────────────┐ ┌──────────────┐          │
│  │  🇧🇷 PT-BR    │ │  🇺🇸 EN      │          │
│  └──────────────┘ └──────────────┘          │
└──────────────────────────────────────────────┘
```

#### Alterar Senha
```
┌──────────────────────────────────────────────┐
│  🔒 Alterar Senha                            │
│  Senha atual    [••••••••••]                │
│  Nova senha     [••••••••••]                │
│  Confirmar      [••••••••••]                │
│  [Alterar Senha]                             │
│  (Mín. 8 caracteres, 1 maiúscula, 1 número  │
│   1 caractere especial)                      │
└──────────────────────────────────────────────┘
```

#### Sistema
```
┌──────────────────────────────────────────────┐
│  ✅ Sistema                                  │
│  Versão do sistema          v0.1.0           │
└──────────────────────────────────────────────┘
```

#### Logout
```
┌──────────────────────────────────────────────┐
│  🚪 Sair                                     │
│  Desconectar e voltar p/ página inicial      │
└──────────────────────────────────────────────┘
```

---

## 18. Logs e Auditoria

### 18.1 Página de Logs

**Acesso:** Admin apenas

```
┌──────────────────────────────────────────────┐
│  Histórico de Atividades                     │
├──────────────────────────────────────────────┤
│  Atividade Diária (30 dias)   [7d][15d][30d]│
│  ┌────────────────────────────────────────┐ │
│  │  GRÁFICO DE BARRAS EMPILHADAS         │ │
│  │  (Chart.js - create/update/delete)     │ │
│  └────────────────────────────────────────┘ │
├──────────────────────────────────────────────┤
│  Cards de estatísticas                       │
│  [Total] [Criações] [Atualizações] [Deleções]│
├──────────────────────────────────────────────┤
│  Filtros: [Ação] [Entidade] [Usuário] [Busca]│
│           [Data Início] [Data Fim]           │
├──────────────────────────────────────────────┤
│  Tabela de logs com paginação                │
│  Data/Hora │ Ação │ Entidade │ Detalhes │ IP│
└──────────────────────────────────────────────┘
```

### 18.2 Página de Auditoria

**Acesso:** Admin apenas

- Gráficos avançados de atividade
- Top usuários por ação
- Distribuição por hora do dia
- Distribuição por dia da semana
- Breakdown ação × entidade
- Últimas 24h

---

## 19. Admin — Usuários

### 19.1 Estrutura

```
┌──────────────────────────────────────────────┐
│  Gerenciar Usuários        [+ Novo Usuário] │
├──────────────────────────────────────────────┤
│  Stats: [Admin: 2] [Gestores: 3] [Empresas] │
│                           [Motoristas: 8]   │
├──────────────────────────────────────────────┤
│  Tabela de usuários                          │
│  Avatar │ Nome │ Email │ Role │ Status │ Ações│
└──────────────────────────────────────────────┘
```

### 19.2 Ações do Admin

| Botão | Ação |
|-------|------|
| ✏️ Editar role | Abre modal para alterar role do usuário |
| 🚫 Ativar/Desativar | Alterna status do usuário |
| 👁️ Visualizar | Abre modal com detalhes completos do usuário |

---

## 20. Painel da Empresa

**Acesso:** Role `empresa` / `company`

```
┌──────────────────────────────────────────────┐
│  ┌─── BANNER GRADIENTE ───────────────────┐ │
│  │  [Logo] Nome da Empresa     [Ativa]    │ │
│  │         CNPJ · Cidade/UF · Telefone   │ │
│  └────────────────────────────────────────┘ │
├──────────────────────────────────────────────┤
│  [Total Cargas] [Disponíveis] [Em Trânsito] │
│  [Entregues]                                 │
├──────────────────────────────────────────────┤
│  Gráfico Doughnut: Status das Cargas        │
├──────────────────────────────────────────────┤
│  Ações Rápidas                               │
│  [Nova Carga] [Ver Matching] [Rotas] [Chat] │
├──────────────────────────────────────────────┤
│  Cargas Recentes (últimas 10)               │
│  ┌─────┬───────┬───────┬──────┬──────────┐ │
│  │Título│Origem │Destino│ Peso │  Status  │ │
│  ├─────┼───────┼───────┼──────┼──────────┤ │
│  │ ...  │ ...   │ ...   │ ...  │ ...      │ │
│  └─────┴───────┴───────┴──────┴──────────┘ │
├──────────────────────────────────────────────┤
│  Matches Recentes (últimos 10)              │
│  ┌──────┬────────┬───────┬──────┬────────┐ │
│  │Carga │Motorista│ Score │ Data │ Status │ │
│  ├──────┼────────┼───────┼──────┼────────┤ │
│  │ ...  │ ...    │ ...   │ ...  │ ...    │ │
│  └──────┴────────┴───────┴──────┴────────┘ │
└──────────────────────────────────────────────┘
```

---

## 21. Documentação Integrada

**Página:** `#docs`

Seções disponíveis:
1. 📋 Visão Geral — Problema, solução, stack
2. 🚀 Quick Start — Setup, seed, login
3. ✨ Funcionalidades — 10 cards
4. 👥 Perfis — Admin, Gestor, Empresa, Motorista
5. 📄 Páginas — Tabela com todas as 21 páginas
6. 🔌 API — Endpoints organizados
7. 🌐 Deploy — Docker, Vercel, Railway, Supabase
8. 🏗️ Arquitetura — Diagrama e diretórios

Navegação por seções: botões no topo que alternam o conteúdo.

---

## 22. Alertas de Segurança

**Acesso:** Admin apenas

Exibe atividades suspeitas consolidadas:
- Múltiplos login failures
- Edições em massa
- Deleções suspeitas
- Tabela com data, usuário, ação, detalhes

---

## 23. Ordem de Serviço

### 23.1 Modal de Criação

Disponível após confirmação do match (status `confirmed`).

```
┌──────────────────────────────────────────────┐
│  Nova Ordem de Serviço                       │
├──────────────────────────────────────────────┤
│  Criar OS para: "Eletrônicos POA"           │
│                                              │
│  Tipo de OS: [📝 Texto] [📄 PDF] [📎 Upload]│
│                                              │
│  Descrição / Observações                     │
│  ┌────────────────────────────────────────┐ │
│  │                                        │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  Valor (R$) — opcional                      │
│  ┌────────────────────────────────────────┐ │
│  │ 0,00                                   │ │
│  └────────────────────────────────────────┘ │
├──────────────────────────────────────────────┤
│  [Cancelar]           [Criar OS]            │
└──────────────────────────────────────────────┘
```

### 23.2 Tipos de OS

| Tipo | Descrição |
|------|-----------|
| 📝 Texto | Descrição livre com observações |
| 📄 PDF | Gerado automaticamente com dados da carga + motorista |
| 📎 Upload | Upload de arquivo personalizado |

---

## 24. Modo Offline / PWA

### 24.1 Indicadores

| Indicador | Onde | Descrição |
|-----------|------|-----------|
| Badge laranja | Navbar (ícone de sincronização) | Número de ações pendentes na fila offline |
| "Offline" com bolinha amarela | Navbar | Exibido quando sem internet |
| Toast "Você está offline" | Toast | Ao ficar offline |
| Toast "Conexão restabelecida" | Toast | Ao voltar ao online |

### 24.2 Funcionalidades Offline

- Ações POST/PATCH/DELETE são enfileiradas em `localStorage`
- Ao voltar ao online, a fila é processada automaticamente
- Clique no ícone de sincronização para processar manualmente
- Banner de atualização PWA (nova versão disponível)

---

## 25. Tabela de Rotas e Permissões

### 25.1 Páginas vs Roles

| # | Página | URL Hash | Admin | Gestor | Empresa | Motorista | Visitante |
|---|--------|----------|:-----:|:------:|:-------:|:---------:|:---------:|
| 1 | Landing | `#landing` | ❌ | ❌ | ❌ | ❌ | ✅ |
| 2 | Login | `#login` | ❌ | ❌ | ❌ | ❌ | ✅ |
| 3 | Dashboard | `#dashboard` | ✅ | ✅ | ✅ | ✅ | ❌ |
| 4 | Empresas | `#companies` | ✅ | ✅ | ✅ | ✅ | ❌ |
| 5 | Motoristas | `#drivers` | ✅ | ✅ | ✅ | ✅ | ❌ |
| 6 | Veículos | `#vehicles` | ✅ | ✅ | ✅ | ✅ | ❌ |
| 7 | Rotas | `#routes` | ✅ | ✅ | ✅ | ✅ | ❌ |
| 8 | Cargas | `#loads` | ✅ | ✅ | ✅ | ✅ | ❌ |
| 9 | Matching | `#matching` | ✅ | ✅ | ✅ | ✅ | ❌ |
| 10 | Chat | `#chat` | ✅ | ✅ | ✅ | ✅ | ❌ |
| 11 | Documentos | `#documents` | ✅ | ✅ | ✅ | ✅ | ❌ |
| 12 | Mapa | `#maps` | ✅ | ✅ | ✅ | ✅ | ❌ |
| 13 | Notificações | `#notifications` | ✅ | ✅ | ✅ | ✅ | ❌ |
| 14 | Avaliações | `#reviews` | ✅ | ✅ | ✅ | ✅ | ❌ |
| 15 | Fretes | `#freights` | ✅ | ✅ | ✅ | ✅ | ❌ |
| 16 | Histórico | `#logs` | ✅ | ✅ | ✅ | ✅ | ❌ |
| 17 | Configurações | `#settings` | ✅ | ✅ | ✅ | ✅ | ❌ |
| 18 | Perfil | `#profile` | ✅ | ✅ | ✅ | ✅ | ❌ |
| 19 | Documentação | `#docs` | ✅ | ✅ | ✅ | ✅ | ❌ |
| 20 | Alertas | `#alerts` | ✅ | ❌ | ❌ | ❌ | ❌ |
| 21 | Auditoria | `#audit` | ✅ | ❌ | ❌ | ❌ | ❌ |
| 22 | Admin Users | `#admin-users` | ✅ | ❌ | ❌ | ❌ | ❌ |
| 23 | Painel Empresa | `#company` | ❌ | ❌ | ✅ | ❌ | ❌ |

### 25.2 Sidebar visibility

| Página | Grupo | Visível para |
|--------|-------|--------------|
| Alerts | Comunicação | Admin apenas |
| Audit | Comunicação | Admin apenas |
| Admin Users | Conta | Admin apenas |
| Painel Empresa | Conta | Empresa/Company apenas |

---

## Apêndice A: Fluxos de Navegação

### Visitante Não Autenticado
```
App.initialize()
  → Storage.isLoggedIn() = false
  → _renderLanding()
    → Router.init() → hash "#landing"
    → LandingPage.render()
      → Hero, Cargas Disponíveis, Features, etc.
    → Cliques nos botões → Router.go('login')
```

### Usuário Autenticado
```
App.initialize()
  → Storage.isLoggedIn() = true
  → _validateToken()
    → GET /auth/me
    → Token válido → _renderApp()
      → Sidebar + Navbar + Main Content
      → Router.init() → hash atual ou "#dashboard"
```

### Criação de Carga (exemplo CRUD)
```
Página Cargas (#loads)
  → Clique "+ Nova Carga"
    → Modal.openForm({ title: "Nova Carga", fields: [...] })
    → Preenche formulário
    → Clique "Criar Carga"
      → Api.post("loads", payload)
      → Toast.success("Carga criada com sucesso!")
      → Modal.close()
      → Router.refresh() (tabela atualizada)
```

### Matching → Chat → OS
```
Página Matching (#matching)
  → Filtros → Resultados
  → Score ≥ 75% → Clique "Criar Match"
    → Api.post("matching", { loadId, driverId, routeId })
    → Toast.success("Match criado!")
  → Clique "Confirmar Viagem"
    → Api.patch("matching/id", { status: "confirmed" })
    → Toast.success("Viagem confirmada!")
  → Clique "Criar OS"
    → Modal OS → Preenche dados
    → Api.post("service-orders", { ... })
    → Toast.success("OS criada!")
```

---

## Apêndice B: Cores e Temas

### Tema Claro
| Elemento | Classe |
|----------|--------|
| Background | `bg-white` / `bg-gray-50` |
| Texto | `text-gray-900` / `text-gray-500` |
| Cards | `bg-white border-gray-200` |
| Sidebar | classes `bg-sidebar` customizadas |
| Navbar | `bg-white border-gray-200` |

### Tema Escuro
| Elemento | Classe |
|----------|--------|
| Background | `dark:bg-gray-950` / `dark:bg-gray-900` |
| Texto | `dark:text-white` / `dark:text-gray-400` |
| Cards | `dark:bg-gray-800 dark:border-gray-700` |
| Sidebar | classes `dark:bg-gray-900` customizadas |
| Navbar | `dark:bg-gray-800 dark:border-gray-700` |

### Cores de Status

| Status | Badge (light) | Badge (dark) |
|--------|---------------|--------------|
| Ativo | `bg-green-100 text-green-800` | `dark:bg-green-900/50 dark:text-green-400` |
| Pendente | `bg-yellow-100 text-yellow-800` | `dark:bg-yellow-900/30 dark:text-yellow-300` |
| Disponível | `bg-green-100 text-green-800` | `dark:bg-green-900/50 dark:text-green-400` |
| Em Trânsito | `bg-indigo-100 text-indigo-800` | `dark:bg-indigo-900/50 dark:text-indigo-400` |
| Entregue | `bg-green-100 text-green-800` | `dark:bg-green-900/50 dark:text-green-400` |
| Cancelado | `bg-red-100 text-red-800` | `dark:bg-red-900/50 dark:text-red-400` |
| Manutenção | `bg-orange-100 text-orange-800` | `dark:bg-orange-900/50 dark:text-orange-400` |
| Concluído | `bg-gray-100 text-gray-800` | `dark:bg-gray-700 dark:text-gray-400` |

---

## Apêndice C: Utilitários de Interface

| Função | Descrição |
|--------|-----------|
| `Utils.escapeHtml(str)` | Escapa HTML para segurança XSS |
| `Utils.formatNumber(num)` | Formata número (ex: 1500 → "1.500") |
| `Utils.formatDate(date, time)` | Formata data (ex: "10/07/2026" ou "10/07/2026 14:30") |
| `Utils.getStatusLabel(status)` | Traduz status para label (ex: "available" → "Disponível") |
| `Utils.getStatusClass(status)` | Retorna classe Tailwind para badge de status |
| `Utils.getInitials(name)` | Retorna iniciais do nome (ex: "João Silva" → "JS") |
| `Utils.getAvatarColor(name)` | Retorna cor única baseada no nome |
| `Utils.generateId()` | Gera ID único |
| `Utils.renderStars(score)` | Renderiza estrelas (★★★★☆) |
| `Utils.getPeriodDates(period)` | Retorna { dateFrom, dateTo } para "today", "week", "month" |
| `Utils.renderFilterCard(opts)` | Renderiza card de filtro clicável |
| `Utils.renderPeriodFilter(opts)` | Renderiza botões de período [Hoje][Semana][Mês] |
| `Utils.renderExportCsvButton(ns)` | Renderiza botão de exportar CSV |
| `Icons._s(path, opts)` | Função base para gerar SVGs |
