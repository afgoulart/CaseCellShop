# Performance Tests — CaseCellShop

Testes de carga com [Locust](https://locust.io) para validar a resiliência do backend.

## Pré-requisitos

```bash
pip install locust
```

## Como executar

### Interface web (recomendado para explorar)
```bash
cd performance
locust -f locustfile.py --host http://localhost:3001
# Acesse http://localhost:8089 e configure usuários/spawn rate
```

### Modo headless (CI/CD)
```bash
locust -f locustfile.py --host http://localhost:3001 \
       --users 50 --spawn-rate 5 --run-time 60s --headless
```

### Com relatório HTML
```bash
locust -f locustfile.py --host http://localhost:3001 \
       --users 50 --spawn-rate 5 --run-time 60s --headless \
       --html report.html
```

## Cenários cobertos

| Usuário             | Cenário                                      | Frequência |
|---------------------|----------------------------------------------|------------|
| `ShopperUser`       | Listar produtos                              | 3×         |
| `ShopperUser`       | Detalhe de produto                           | 2×         |
| `ShopperUser`       | Checkout com sucesso (ou 409/503 aceitável)  | 2×         |
| `ShopperUser`       | Checkout com payload inválido (esperado 400) | 1×         |
| `ShopperUser`       | Replay de idempotency_key                    | 1×         |
| `ShopperUser`       | Health check                                 | 1×         |
| `ConcurrentBuyer`   | Compras simultâneas do mesmo produto         | stress     |

## Metas de performance

| Métrica         | Meta          |
|-----------------|---------------|
| p50 (mediana)   | < 200ms       |
| p95             | < 1000ms      |
| p99             | < 4000ms*     |
| Taxa de erro    | < 1%          |

*O ERP tem delay máximo de 4000ms configurável via `ERP_MAX_DELAY_MS`.
