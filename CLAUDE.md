# CLAUDE.md — CaseCellShop Checkout

Desafio técnico fullstack: mini-sistema de checkout de capinhas de celular.

## Objetivo

Implementar um fluxo de checkout que demonstre:
- Listagem de produtos
- Reserva de estoque sem overselling (race condition safe)
- Resiliência a falhas do ERP (processamento lento/instável)
- Detecção de pedido duplicado (idempotência)
- Feedback claro ao usuário em todos os cenários
- Interface multilíngue (PT/EN)

## Stack

| Camada     | Tecnologia                              |
|------------|-----------------------------------------|
| Backend    | Node.js + Express + TypeScript          |
| Frontend   | React + TypeScript + esbuild            |
| Banco      | `node:sqlite` (nativo Node 22+)         |
| Testes     | `node:test` + Supertest                 |
| i18n       | JSON próprio + Context API + hook `t()` |

**Por que `node:sqlite`:** nativo do Node 22+, sem compilação C++, suporta transações ACID. `better-sqlite3` não compila no Node 24 com paths com espaços.

**Por que `node:test` em vez de Vitest:** Rollup usa binários nativos `.node` que falham com Team ID mismatch no macOS sandbox. `node --test --require tsx/cjs` não tem dependências nativas.

**Por que esbuild em vez de Vite:** mesmo motivo do Rollup — Vite depende do Rollup nativo. esbuild já é instalado como dep do tsx e funciona sem binários externos.

## Estrutura de pastas

```
CaseCellShop/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── connection.ts   # DatabaseSync, WAL, setDb/closeDb
│   │   │   └── seed.ts         # 5 produtos de demo
│   │   ├── routes/
│   │   │   ├── products.ts     # GET /api/products, /api/products/:id
│   │   │   ├── checkout.ts     # POST /api/checkout
│   │   │   └── orders.ts       # GET /api/orders/:id
│   │   ├── services/
│   │   │   ├── erp-simulator.ts  # delay + falha + retry
│   │   │   └── stock.service.ts  # BEGIN EXCLUSIVE + guard atômico
│   │   └── index.ts            # app Express; listen só se require.main
│   ├── tests/
│   │   ├── setup.ts            # banco :memory: + resetTestData
│   │   ├── products.test.ts
│   │   ├── checkout.test.ts    # 9 cenários
│   │   └── concurrency.test.ts # 10 req simultâneas
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/client.ts       # fetch wrapper tipado
│   │   ├── i18n/
│   │   │   ├── pt.json         # strings em português
│   │   │   ├── en.json         # strings em inglês
│   │   │   └── useTranslation.tsx  # Context + hook + interpolação
│   │   ├── components/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── CheckoutModal.tsx
│   │   │   └── StatusBadge.tsx
│   │   ├── pages/ProductList.tsx
│   │   ├── App.tsx             # I18nProvider + LangToggle
│   │   └── main.tsx
│   ├── dist/                   # bundle gerado pelo esbuild
│   ├── serve.cjs               # servidor estático Node puro + proxy /api
│   └── package.json
├── CLAUDE.md
├── PROMPTS.md
└── README.md
```

## Regras de negócio críticas

### Estoque
- Reserva via `UPDATE ... WHERE stock >= qty` dentro de `BEGIN EXCLUSIVE`.
- Retorna `409` com `{ error: "insufficient_stock" }` se falhar.
- Nunca decrementar fora de transação.

### Idempotência (anti-duplicata)
- Frontend gera UUID v4 ao abrir o modal — enviado como `idempotency_key`.
- Backend retorna o resultado cacheado sem reprocessar se a key já existir.

### Simulação do ERP
- `erp-simulator.ts` lê env vars a cada chamada (não na carga do módulo).
- Delay aleatório + 20% de falha + retry com backoff (max 3×) antes de `503`.

## i18n

### Adicionar nova string
1. Adicionar a chave em `frontend/src/i18n/pt.json` e `en.json`.
2. Usar `t('chave')` no componente.
3. Para interpolação: `t('chave', { count: 5 })` → `"{{count}} disponíveis"`.

### Adicionar novo idioma
1. Criar `frontend/src/i18n/xx.json` com as mesmas chaves de `pt.json`.
2. Adicionar `xx` ao tipo `Lang` e ao objeto `dictionaries` em `useTranslation.tsx`.

### Persistência
O idioma selecionado é salvo em `localStorage` com a chave `lang`.

## Endpoints

| Método | Path               | Descrição                        |
|--------|--------------------|----------------------------------|
| GET    | `/api/products`    | Lista produtos com estoque atual |
| GET    | `/api/products/:id`| Detalhe de um produto            |
| POST   | `/api/checkout`    | Cria pedido                      |
| GET    | `/api/orders/:id`  | Consulta status do pedido        |
| GET    | `/api/health`      | Health check                     |

### POST /api/checkout — body
```json
{
  "product_id": 1,
  "quantity": 2,
  "idempotency_key": "uuid-v4"
}
```

### Respostas esperadas
| Status | Cenário                        |
|--------|--------------------------------|
| 201    | Pedido criado com sucesso      |
| 400    | Entrada inválida               |
| 404    | Produto não encontrado         |
| 409    | Estoque insuficiente           |
| 503    | ERP indisponível após retries  |

## Rodando localmente

```bash
# Backend
cd backend && npm install && npm run dev   # porta 3001

# Frontend (requer rebuild do bundle)
cd frontend && npm install
node_modules/.bin/esbuild src/main.tsx \
  --bundle --outfile=dist/bundle.js \
  --jsx=automatic --platform=browser \
  --loader:.tsx=tsx --loader:.ts=ts --loader:.json=json
node serve.cjs                            # porta 5173

# Testes
cd backend && npm test

# Teste de concorrência (com backend rodando)
cd backend && npm run test:concurrency
```

> Se usar Vite normalmente (fora do Codex App), `npm run dev` no frontend funciona diretamente.

## Variáveis de ambiente

```
PORT=3001
ERP_FAILURE_RATE=0.2
ERP_MAX_DELAY_MS=4000
ERP_MIN_DELAY_MS=500
DB_PATH=./data/shop.db
```

## O que NÃO está no escopo

- Autenticação/JWT
- Pagamento real
- Docker / deploy cloud
- Mensageria (RabbitMQ, Kafka)
- Layout elaborado / design system

## Próximos passos naturais

1. Substituir SQLite por PostgreSQL para produção multi-instância.
2. Extrair reserva de estoque para serviço com fila (Redis + Bull).
3. Adicionar circuit breaker no cliente ERP (`opossum`).
4. Logs estruturados com correlation ID (`pino`).
5. Observabilidade: métricas de latência p95 do ERP e taxa de conflito de estoque.
6. Expandir i18n para mais idiomas e adicionar traduções dos nomes/descrições dos produtos.
