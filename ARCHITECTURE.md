# OpenCargo — Architecture

> Documento de arquitetura do projeto OpenCargo — plataforma open source para logística colaborativa.

---

## Visão Geral

O **OpenCargo** é uma plataforma open source para logística colaborativa focada em reduzir viagens vazias, conectar empresas e transportadores e otimizar o aproveitamento da capacidade dos veículos.

O projeto foi concebido para ser modular, escalável e independente de serviços pagos.

Toda a arquitetura prioriza tecnologias open source e self-hosted.

---

## Missão

Reduzir o desperdício no transporte de cargas através do compartilhamento inteligente de rotas e fretes de retorno.

---

## Problema

Milhares de caminhões percorrem diariamente grandes distâncias vazios ou parcialmente carregados.

Isso gera:

- desperdício de combustível
- aumento do custo do frete
- maior emissão de CO₂
- baixa rentabilidade do transportador

O OpenCargo busca conectar cargas disponíveis com caminhões que já realizarão determinada rota.

---

## Filosofia

O projeto segue alguns princípios fundamentais.

### Open Source

Todo o sistema será desenvolvido utilizando tecnologias abertas.

### Self Hosted

O usuário poderá instalar toda a plataforma em seu próprio servidor.

### Independência

Evitar dependência de APIs pagas ou serviços que exijam cartão de crédito.

### Performance

Priorizar desempenho e baixo consumo de recursos.

### Modularidade

Todos os módulos deverão ser independentes.

### API First

Toda funcionalidade deverá estar disponível através da API.

---

## Escopo Inicial

O MVP terá foco exclusivamente em **frete de retorno (Backhaul)**.

Exemplo:

```text
Porto Alegre
        │
        ▼
Uruguaiana

Entrega realizada

↓

Retorno vazio

↓

Sistema procura cargas

↓

Motorista aceita

↓

Retorno carregado
```

O motorista informa apenas que realizará uma rota vazia.

O sistema identifica cargas compatíveis.

---

## Arquitetura Geral

```text
                Frontend
                    │
         REST API / WebSocket
                    │
               OpenCargo API
                    │
    ┌───────────────┼───────────────┐
 Auth          Matching          Chat
 Users          Routes      Notifications
 Vehicles       Loads            Maps
                    │
              Banco de Dados
```

---

## Tecnologias

### Backend

- Node.js
- Fastify
- TypeScript
- JWT
- Zod

### Banco

**Desenvolvimento**

- SQLite

**Produção**

- PostgreSQL

**ORM**

- Drizzle ORM

### Frontend

- HTML5
- Tailwind CSS
- Alpine.js (MVP)

**Evolução**

- Vue.js

### Mapas

Nunca depender de Google Maps.

Tecnologias previstas:

- OpenStreetMap
- Leaflet
- Nominatim
- Valhalla

### Comunicação

- REST API
- WebSocket

### Infraestrutura

- Docker
- Docker Compose
- Nginx

---

## Estrutura do Projeto

```text
OpenCargo/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── companies/
│   │   ├── drivers/
│   │   ├── vehicles/
│   │   ├── routes/
│   │   ├── loads/
│   │   ├── matching/
│   │   ├── maps/
│   │   ├── notifications/
│   │   ├── chat/
│   │   └── common/
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   └── src/
├── docs/
├── database/
├── docker/
├── scripts/
└── tests/
```

---

## Arquitetura em Camadas

### Presentation

Frontend. Responsável pela interface.

### API

Recebe requisições. Validação. Autenticação.

### Business

Regras de negócio. Matching. Disponibilidade. Capacidade.

### Persistence

Banco de dados.

---

## Modelo Conceitual

```text
Usuário → Empresa → Carga → Matching → Motorista → Veículo → Entrega
```

---

## Motor de Matching

O algoritmo será desenvolvido em fases.

### MVP

Matching por cidades.

Exemplo:
- Origem: Santa Maria
- Destino: Alegrete

O sistema procura motoristas cuja rota contenha ambas as cidades na ordem correta.

Também verifica:
- peso disponível
- volume disponível
- datas compatíveis

### Evolução

Posteriormente:
- distância máxima
- desvios permitidos
- cálculo automático
- otimização

---

## Fluxo Principal

```text
Empresa → Cadastrar carga → Sistema procura caminhões
    → Motorista recebe proposta → Aceita → Coleta → Entrega → Finalização
```

---

## Módulos

### Core

Autenticação, Configuração, Permissões, Logs

### Users

Usuários, Empresas, Motoristas

### Vehicles

Cadastro, Capacidade, Documentação

### Routes

Cadastro, Retorno, Paradas, Disponibilidade

### Loads

Cadastro, Peso, Volume, Tipo, Status

### Matching

Motor responsável pela compatibilidade.

### Maps

Integração com OpenStreetMap.

### Chat

Comunicação entre empresa e motorista.

### Notifications

WebSocket, Push, E-mail

---

## Integração com Nexus

O OpenCargo foi projetado para funcionar de forma independente, mas também poderá ser executado como um módulo do Nexus.

Nesse cenário:
- O Nexus será responsável por autenticação centralizada, configuração e serviços compartilhados.
- O OpenCargo consumirá APIs do Nexus para usuários, permissões, auditoria e monitoramento.
- A lógica de logística permanecerá isolada no OpenCargo, permitindo implantação independente quando necessário.

---

## Objetivos de Longo Prazo

- Aplicativo Android
- Aplicativo iOS
- Rastreamento em tempo real
- Inteligência Artificial para otimização de cargas
- Integração com cooperativas
- Integração com ERPs
- Marketplace de fretes
- Plataforma internacional

---

## Objetivo Final

Criar uma plataforma de logística colaborativa open source, moderna, modular e escalável, capaz de reduzir viagens vazias, aumentar a eficiência do transporte de cargas e servir como referência para soluções self-hosted de logística.
