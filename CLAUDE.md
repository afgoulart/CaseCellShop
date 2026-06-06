# CLAUDE.md — CaseCellShop Checkout

Desafio técnico fullstack: mini-sistema de checkout de capinhas de celular.

## Objetivo

Implementar um fluxo de checkout que demonstre:
- Listagem de produtos
- Reserva de estoque sem overselling (race condition safe)
- Resiliência a falhas do ERP (processamento lento/instável)
- Detecção de pedido duplicado (idempotência)
- Feedback claro ao usuário em todos os cenários

## Stack

| Camada     | Tecnologia                          |
|------------|-------------------------------------|
| Backend    | Node.js + Express + TypeScript      |
| Frontend   | React + TypeScript + Vite           |
| Banco      | SQLite via `better-sqlite3`         |
| Testes     | Vitest (unit) + Supertest (e2e API) |

**Por que SQLite:** permite testar concorrência real com transações ACID sem precisar de Docker ou banco externo. `better-sqlite3` é síncrono, o que simplifica o controle de transações.

## Estrutura de pastas

```
CaseCellShop/
├── backend/
│   ├── src/
│   │   ├── db/           # seed, migrations, conexão SQLite
│   │   ├── routes/       # products, checkout, orders
│   │   ├── services/     # lógica de negócio (stock, erp-simulator)
│   │   └── index.ts
│   ├── tests/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # ProductCard, CheckoutForm, StatusBadge
│   │   ├── pages/        # ProductList, OrderStatus
│   │   └── main.tsx
│   └── package.json
└── README.md
```

## Regras de negócio críticas

### Estoque
- Reserva via `UPDATE ... WHERE stock >= qty` dentro de transação serializable.
- Retorna `409 Conflict` com `{ error: "insufficient_stock" }` se falhar.
- Nunca decrementar fora de transação — essa é a regra mais importante.

### Idempotência (anti-duplicata)
- Frontend envia `idempotency_key` (UUID v4 gerado no clique de "Comprar").
- Backend salva o key com resultado. Segunda chamada com mesmo key retorna o resultado cacheado sem reprocessar.

### Simulação do ERP
- `erp-simulator.ts` introduz delay aleatório (500ms–4s) e 20% de chance de erro temporário.
- Checkout usa retry com backoff (max 3 tentativas) antes de retornar `503`.

## Endpoints

| Método | Path                  | Descrição                          |
|--------|-----------------------|------------------------------------|
| GET    | `/api/products`       | Lista produtos com estoque atual   |
| POST   | `/api/checkout`       | Cria pedido (corpo abaixo)         |
| GET    | `/api/orders/:id`     | Consulta status do pedido          |

### POST /api/checkout — body
```json
{
  "product_id": 1,
  "quantity": 2,
  "idempotency_key": "uuid-v4"
}
```

### Respostas esperadas
| Status | Cenário                       |
|--------|-------------------------------|
| 201    | Pedido criado com sucesso     |
| 400    | Entrada inválida              |
| 409    | Estoque insuficiente          |
| 409    | Pedido duplicado (idempotente)|
| 503    | ERP indisponível após retries |

## Rodando localmente

```bash
# Backend
cd backend && npm install && npm run dev   # porta 3001

# Frontend
cd frontend && npm install && npm run dev  # porta 5173

# Testes
cd backend && npm test
```

## Como rodar os testes de concorrência (bônus)

```bash
cd backend && npm run test:concurrency
```
Dispara 10 requisições simultâneas comprando o mesmo produto com estoque = 5. Espera exatamente 5 sucessos e 5 erros de estoque.

## Variáveis de ambiente

```
PORT=3001
ERP_FAILURE_RATE=0.2      # 0 a 1 — probabilidade de falha simulada
ERP_MAX_DELAY_MS=4000
```

## O que NÃO está no escopo

- Autenticação/JWT
- Pagamento real
- Docker / deploy cloud
- Mensageria (RabbitMQ, Kafka)
- Layout elaborado / design system

## Próximos passos naturais (não implementados)

1. Substituir SQLite por PostgreSQL para produção multi-instância.
2. Extrair a reserva de estoque para um serviço dedicado com fila (Redis + Bull).
3. Adicionar circuit breaker no cliente ERP (ex.: `opossum`).
4. Logs estruturados com correlation ID por requisição (ex.: `pino`).
5. Observabilidade: métricas de latência p95 do ERP e taxa de conflito de estoque.
