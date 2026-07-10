# OpenCargo — Roadmap

> Planejamento de versões e prioridades do projeto.

---

## ✅ Versão 0.1 — MVP: Frete de Retorno

**Foco: Estrutura e funcionalidades básicas**

- [x] Estrutura do projeto definida
- [x] Arquitetura documentada
- [x] Modelo de dados definido (SQLite + PostgreSQL)
- [x] Autenticação (registro e login com JWT + bcrypt)
- [x] CRUD de Empresas
- [x] CRUD de Motoristas
- [x] CRUD de Veículos
- [x] CRUD de Rotas
- [x] CRUD de Cargas
- [x] Motor de Matching (por cidades com score)
- [x] Dashboard básico
- [x] Docker setup
- [x] Documentação inicial

---

## ✅ Versão 0.2 — Comunicação e Visualização

- [x] Chat entre empresa e motorista (WebSocket)
- [x] Mapa com Leaflet + OpenStreetMap (dark mode)
- [x] Notificações em tempo real (WebSocket)
- [x] Clustering de marcadores (Leaflet.markercluster)
- [x] Geocoding com Nominatim (autocomplete de cidades)
- [x] Rotas no mapa com OSRM
- [x] Melhorias no dashboard

---

## ✅ Versão 0.3 — Experiência do Usuário

- [x] Notificações push (Web Notification API)
- [x] PWA (Progressive Web App) com Service Worker
- [x] Suporte offline (fila de ações em localStorage)
- [x] Sincronização automática ao voltar ao online
- [x] Banner de atualização PWA (skipWaiting)
- [x] Upload de documentos
- [x] Filtros avançados no matching
- [x] Suporte a múltiplos idiomas (pt-BR, en)
- [x] Avaliações entre as partes
- [x] Histórico de fretes
- [x] Paginação em todas as listas
- [x] Supabase + RLS (Row Level Security)
- [x] Roles: administrador, gestor, empresa, motorista
- [x] Painel da Empresa (dashboard exclusivo)
- [x] Perfil separado de Configurações
- [x] Página de Auditoria com gráficos e estatísticas
- [x] Página de Documentação integrada
- [x] Splash screen animado no carregamento
- [x] Landing page redesenhada com hero image
- [x] Modo mock com persistência em memória (POST/PATCH/DELETE)
- [x] Relatório de atividades suspeitas (segurança)

---

## 🔄 Versão 0.4 — Inteligência e Otimização

- [ ] Matching com distância máxima
- [ ] Desvios permitidos no trajeto
- [ ] Cálculo automático de frete
- [ ] Score de compatibilidade avançado
- [ ] Sugestão de rotas otimizadas
- [ ] Exportar relatórios em PDF
- [ ] Dashboard inteligente por role (admin, empresa, motorista)

---

## ⏳ Versão 1.0 — Plataforma Completa

- [ ] Otimização de rotas com Valhalla
- [ ] API pública para integração
- [ ] Integração com ERPs
- [ ] Cooperativas e grupos
- [ ] Marketplace de fretes
- [ ] Testes de carga e performance
- [ ] Modo escuro avançado (mais temas)
- [ ] Notificações push via Service Worker (background)

---

## ⏳ Versão 2.0 — Expansão

- [ ] Aplicativo Android (React Native / Kotlin)
- [ ] Aplicativo iOS (React Native / Swift)
- [ ] Rastreamento em tempo real
- [ ] IA para otimização de cargas
- [ ] Painel administrativo avançado
- [ ] Plataforma internacional
- [ ] Integração com Google Maps / Waze
- [ ] Gateway de pagamento

---

## Legenda

- ✅ Concluído
- 🔄 Em andamento
- ⏳ Planejado
