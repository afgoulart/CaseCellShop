# CaseCellShop — Desafio Técnico Fullstack

Mini-sistema de checkout de capinhas de celular, desenvolvido como resposta ao desafio técnico de nível Pleno/Fullstack.

---

## Como instalar e rodar

### Pré-requisitos

- Node.js >= 18
- npm >= 9

### Backend (porta 3001)

```bash
cd backend
npm install
npm run dev
```

O banco SQLite é criado automaticamente em `backend/data/shop.db` com 5 produtos seed na primeira execução.

### Frontend (porta 5173)

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`.

### Testes automatizados

```bash
cd backend
npm test
```

### Teste de concorrência (bônus)

Com o backend rodando em paralelo:

```bash
cd backend
npm run test:concurrency
```

Dispara 10 requisições simultâneas para um produto com estoque = 5. Valida que exatamente ≤ 5 pedidos são confirmados.

---

## Variáveis de ambiente

Copie `backend/.env.example` para `backend/.env` e ajuste conforme necessário:

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `PORT` | `3001` | Porta do servidor |
| `ERP_FAILURE_RATE` | `0.2` | Probabilidade de falha (0–1) |
| `ERP_MAX_DELAY_MS` | `4000` | Delay máximo do ERP em ms |
| `ERP_MIN_DELAY_MS` | `500` | Delay mínimo do ERP em ms |
| `DB_PATH` | `./data/shop.db` | Caminho do banco SQLite |

---

## Arquitetura e decisões técnicas

### Stack escolhida

| Camada | Tecnologia | Motivação |
|--------|-----------|-----------|
| Backend | Node.js + Express + TypeScript | Familiar, performático para I/O, ecossistema maduro |
| Frontend | React + TypeScript + Vite | Componentização clara, Vite rápido para dev |
| Banco | SQLite via `node:sqlite` (nativo) | Sem infra externa; suporta transações ACID; ideal para testar concorrência real |
| Validação | Zod | Type-safe, erros estruturados automaticamente |
| Testes | `node:test` + Supertest | Testador nativo do Node.js; Supertest para testes HTTP reais |

### Principais decisões

**1. Reserva de estoque atômica**

A query de reserva usa `UPDATE ... WHERE stock >= qty` dentro de uma transação SQLite serializable. Isso garante que duas requisições concorrentes não possam confirmar o mesmo estoque — o segundo `UPDATE` retorna `changes = 0` e o checkout retorna 409.

```sql
UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?
```

**2. Idempotência via `idempotency_key`**

O frontend gera um UUID v4 ao abrir o modal de checkout. Esse key é enviado junto com cada requisição. Se o servidor já processou aquela key, retorna o resultado cacheado sem chamar o ERP novamente. Previne dupla cobrança em retries do cliente.

**3. Simulação do ERP**

`erp-simulator.ts` introduz delay aleatório (500ms–4s) e 20% de falha. O checkout tenta até 3 vezes com backoff linear (300ms × tentativa). Se todas falharem, o estoque é devolvido e o pedido marcado como `failed`.

**4. SQLite com WAL mode**

`PRAGMA journal_mode = WAL` permite leitura concorrente sem bloquear escritas, o que é essencial para o teste de concorrência.

**5. Banco em memória nos testes**

Os testes injetam um `DatabaseSync` do `node:sqlite` em `:memory:` via `setDb()`. Cada suite começa com produtos seed limpos. O ERP é testado com `ERP_FAILURE_RATE=1` para forçar falha determinística sem mocks.

---

## Endpoints da API

| Método | Path | Descrição |
|--------|------|-----------|
| `GET` | `/api/products` | Lista todos os produtos com estoque |
| `GET` | `/api/products/:id` | Detalhe de um produto |
| `POST` | `/api/checkout` | Cria pedido de compra |
| `GET` | `/api/orders` | Lista todos os pedidos (bônus) |
| `GET` | `/api/orders/:id` | Consulta status do pedido (bônus) |
| `GET` | `/api/health` | Health check |

### POST /api/checkout — body

```json
{
  "product_id": 1,
  "quantity": 2,
  "idempotency_key": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Respostas

| Status | Cenário |
|--------|---------|
| `201` | Pedido criado com sucesso |
| `400` | Entrada inválida (campos ausentes, tipos errados) |
| `404` | Produto não encontrado |
| `409` | Estoque insuficiente |
| `503` | ERP indisponível após 3 tentativas |

---

## Checklist do desafio

### Back-end

- [x] API para listar produtos (`GET /api/products`)
- [x] API para criar compra (`POST /api/checkout`)
- [x] Validação de entradas (Zod — tipos, ranges, UUID)
- [x] Diferencia sucesso / validação / estoque / falha técnica
- [x] Evita overselling (transação atômica SQLite)
- [x] Anti-duplicata via `idempotency_key` (UUID v4)
- [x] Simulação de ERP lento/instável com retry

### Front-end

- [x] Listagem de produtos com estoque
- [x] Formulário de quantidade + botão de compra
- [x] Loading state + botão desabilitado durante processamento
- [x] Mensagens para sucesso, estoque insuficiente, erro de validação e falha temporária
- [x] Estado coerente após erro (retry disponível para `erp_unavailable`)

### Qualidade e entrega

- [x] README com instalação e execução
- [x] Decisões técnicas documentadas
- [x] Testes automatizados (`node:test` + Supertest)
- [x] Código organizado em camadas (routes / services / db)
- [x] **Bônus:** endpoint de status do pedido (`GET /api/orders/:id`)
- [x] **Bônus:** teste de concorrência (`npm run test:concurrency`)
- [x] **Bônus:** logs estruturados com nível e contexto
- [x] `PROMPTS.md` registra os prompts relevantes

---

## Limitações e próximos passos

### Limitações conhecidas

- SQLite funciona bem para uma instância; não escala horizontalmente sem coordenação externa
- O ERP simulator não persiste estado — um restart zera o comportamento simulado
- Sem autenticação/autorização

### Próximos passos naturais

1. Trocar SQLite por PostgreSQL com `FOR UPDATE SKIP LOCKED` para múltiplas instâncias
2. Extrair reserva de estoque para um serviço dedicado com fila (Redis + Bull)
3. Adicionar circuit breaker no cliente ERP (ex.: `opossum`)
4. Logs com correlation ID por requisição (`pino` + request-id middleware)
5. Rate limiting por IP no endpoint de checkout
6. Observabilidade: métricas de latência p95 do ERP e taxa de conflito de estoque

---

## Bônus — Deploy na Vercel

O frontend Next.js está configurado para rodar na Vercel sem nenhuma alteração de código. O banco de dados utilizado em produção é o **Prisma Postgres** (cloud), conectado diretamente pelas API Routes do Next.js.

### Variáveis de ambiente necessárias na Vercel

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string do Prisma Postgres (`postgres://...@db.prisma.io/...`) |
| `ERP_FAILURE_RATE` | Probabilidade de falha do ERP simulado (ex.: `0.2`) |
| `ERP_MAX_DELAY_MS` | Delay máximo do ERP em ms (ex.: `4000`) |
| `ERP_MIN_DELAY_MS` | Delay mínimo do ERP em ms (ex.: `500`) |

### Como fazer o deploy

1. Faça o fork/clone do repositório
2. Importe o projeto na [Vercel](https://vercel.com/new) apontando para a pasta `frontend/`
3. Configure as variáveis de ambiente acima no painel da Vercel
4. Clique em **Deploy**

> O backend Express (SQLite) é utilizado apenas localmente para testes. Em produção na Vercel, todas as rotas `/api/*` são servidas pelo Next.js conectado ao Prisma Postgres — sem necessidade de servidor separado.

---

## Estrutura de arquivos

```
CaseCellShop/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── connection.ts   # SQLite setup, schema, WAL
│   │   │   └── seed.ts         # Dados iniciais
│   │   ├── routes/
│   │   │   ├── products.ts     # GET /api/products, /api/products/:id
│   │   │   ├── checkout.ts     # POST /api/checkout
│   │   │   └── orders.ts       # GET /api/orders/:id
│   │   ├── services/
│   │   │   ├── erp-simulator.ts  # Delay + falha + retry
│   │   │   └── stock.service.ts  # Reserva atômica de estoque
│   │   └── index.ts            # Express app + seed
│   ├── tests/
│   │   ├── setup.ts            # Mock do banco em memória
│   │   ├── products.test.ts
│   │   ├── checkout.test.ts    # Todos os cenários de checkout
│   │   └── concurrency.test.ts # 10 req simultâneas → max 5 confirmadas
│   └── package.json
├── frontend/
│   └── src/
│       ├── api/client.ts       # Fetch wrapper tipado
│       ├── components/
│       │   ├── ProductCard.tsx
│       │   ├── CheckoutModal.tsx
│       │   └── StatusBadge.tsx
│       ├── pages/ProductList.tsx
│       └── App.tsx
├── CLAUDE.md
└── PROMPTS.md
```
