# PROMPTS.md — Registro de prompts usados no desenvolvimento

Este arquivo registra os prompts relevantes utilizados com assistência de IA (Claude Code / claude-sonnet-4-6) durante o desenvolvimento deste desafio técnico.

---

## Sessão 1 — Documentação inicial

**Prompt:**
> ler readme e gerar um CLAUDE.md e um PROMPTs.md

**Resultado:** Gerou `CLAUDE.md` com decisões de arquitetura (stack, estrutura de pastas, regras de negócio, endpoints, estratégia de concorrência) e `PROMPTS.md`.

---

## Sessão 2 — Configuração do ambiente

**Prompt:**
> atualizar skills

**Resultado:** Adicionou permissões automáticas ao `.claude/settings.json` para `npm`, `npx`, `node`, `git`, `mkdir`, `find`, `ls`, `cat`, `curl` — evita prompts repetitivos durante o desenvolvimento.

---

## Sessão 3 — Implementação completa do projeto

**Prompt:**
> implementar o projeto com base no README.md

**Resultado:** Implementação fullstack completa:

### Decisões tomadas com assistência da IA

**1. Stack sem dependências nativas**

Decisão inicial: `better-sqlite3`. Problema encontrado: não compila no Node 24 com paths contendo espaços. Migração para `node:sqlite` (nativo do Node 22+) — sem compilação C++, sem dependências extras.

**2. Runner de testes: `node:test` em vez de Vitest**

Vitest (e Rollup) usa módulos nativos `.node` que não carregam no ambiente do Codex App devido a Team ID mismatch de assinatura de código macOS. Solução: `node --test --require tsx/cjs` — zero dependências nativas, roda direto com Node 24.

**3. Controle de ERP via `process.env` em vez de mock**

O mock de módulos CJS via substituição de propriedade (`module.fn = ...`) não intercepta chamadas quando o compilador (esbuild/tsx) captura a referência da função no momento do `require`. Solução: `erp-simulator.ts` lê as env vars a cada chamada (`getConfig()` inline), permitindo que os testes controlem o comportamento via `process.env.ERP_FAILURE_RATE`.

**4. Banco em memória para testes**

`DatabaseSync(':memory:')` combinado com `setDb(testDb)` (injeção de dependência simples) garante isolamento entre suites sem necessitar de mock do módulo de conexão.

**5. Bug identificado e corrigido: `before(setupTestDb)` capturando TestContext**

`node:test` passa o `TestContext` como primeiro argumento para callbacks de `before`. A função `setupTestDb(db?: DatabaseSync)` estava recebendo o contexto como `db`, causando erros. Fix: remover o parâmetro opcional da assinatura.

### Arquivos criados nesta sessão

**Backend:**
- `backend/package.json` — scripts com `--no-warnings`, `node:test`, `tsx`
- `backend/tsconfig.json`
- `backend/src/db/connection.ts` — `DatabaseSync`, WAL, `setDb`/`closeDb` para testes
- `backend/src/db/seed.ts` — 5 produtos de demo
- `backend/src/services/erp-simulator.ts` — delay aleatório + retry + env vars dinâmicas
- `backend/src/services/stock.service.ts` — reserva atômica com `BEGIN EXCLUSIVE`
- `backend/src/routes/products.ts` — `GET /api/products`, `GET /api/products/:id`
- `backend/src/routes/checkout.ts` — `POST /api/checkout` com validação Zod + idempotência
- `backend/src/routes/orders.ts` — `GET /api/orders/:id`
- `backend/src/index.ts` — app Express; `listen` só quando `require.main === module`
- `backend/tests/setup.ts` — factory de banco em memória, `resetTestData`
- `backend/tests/products.test.ts` — 5 testes de produtos
- `backend/tests/checkout.test.ts` — 9 testes de checkout (todos os cenários do README)
- `backend/tests/concurrency.test.ts` — dispara 10 req simultâneas, valida sem overselling

**Frontend:**
- `frontend/package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`
- `frontend/src/api/client.ts` — fetch wrapper tipado
- `frontend/src/components/ProductCard.tsx` — card com botão desabilitado quando sem estoque
- `frontend/src/components/CheckoutModal.tsx` — modal com estados: form / loading / success / error
- `frontend/src/components/StatusBadge.tsx` — badge colorido por status
- `frontend/src/pages/ProductList.tsx` — grid de produtos + toast de pedido confirmado
- `frontend/src/App.tsx`, `frontend/src/main.tsx`

**Documentação:**
- `README.md` — reescrito com instalação, env vars, arquitetura, checklist, limitações
- `CLAUDE.md` — guia para Claude Code sobre o projeto

### Resultado dos testes

```
✔ POST /api/checkout (14 testes, 0 falhas)
  ✔ cria pedido com sucesso
  ✔ desconta estoque após compra
  ✔ retorna 400 para product_id ausente
  ✔ retorna 400 para quantity = 0
  ✔ retorna 400 para idempotency_key inválida
  ✔ retorna 409 para estoque insuficiente
  ✔ retorna 404 para produto inexistente
  ✔ retorna 503 e restaura estoque quando ERP falha
  ✔ idempotência: mesma key retorna resultado cacheado
✔ GET /api/products (2 testes)
✔ GET /api/products/:id (3 testes)

14 passed, 0 failed
```

---

## Notas sobre uso de IA

- A IA foi usada para gerar estrutura, boilerplate e decisões de arquitetura.
- Bugs foram identificados e corrigidos em iteração (Team ID macOS, TestContext capturado, env vars estáticas).
- Todo código foi revisado antes de cada commit.
- As decisões de negócio (idempotência, rollback de estoque, retry do ERP) foram definidas a partir da leitura do README; a IA ajudou a estruturá-las em código.
