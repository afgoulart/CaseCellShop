"""
CaseCellShop — Teste de Performance com Locust
===============================================

Simula usuários navegando e comprando capinhas de celular.

Instalação:
    pip install locust

Execução:
    cd performance
    locust -f locustfile.py --host http://localhost:3001

    # Ou modo headless (CI):
    locust -f locustfile.py --host http://localhost:3001 \
           --users 50 --spawn-rate 5 --run-time 30s --headless

    # Com relatório HTML:
    locust -f locustfile.py --host http://localhost:3001 \
           --users 50 --spawn-rate 5 --run-time 60s --headless \
           --html report.html

Interface web: http://localhost:8089
"""

import uuid
import random
from locust import HttpUser, task, between, events


# ── Cenários de usuário ──────────────────────────────────────────────────────

class ShopperUser(HttpUser):
    """
    Usuário comum: lista produtos, escolhe um e tenta comprar.
    Wait time simula tempo de leitura/decisão.
    """
    wait_time = between(1, 3)

    def on_start(self):
        """Carrega lista de produtos na chegada."""
        with self.client.get("/api/products", name="/api/products [list]", catch_response=True) as resp:
            if resp.status_code == 200:
                data = resp.json().get("data", [])
                self.products = [p for p in data if p["stock"] > 0]
                if not self.products:
                    self.products = data  # fallback: inclui sem estoque
            else:
                resp.failure(f"Falha ao listar produtos: {resp.status_code}")
                self.products = []

    @task(3)
    def list_products(self):
        """Lista produtos (comportamento mais frequente)."""
        with self.client.get("/api/products", name="/api/products [list]", catch_response=True) as resp:
            if resp.status_code != 200:
                resp.failure(f"Expected 200, got {resp.status_code}")

    @task(2)
    def get_product_detail(self):
        """Consulta detalhe de um produto aleatório."""
        if not self.products:
            return
        product = random.choice(self.products)
        url = f"/api/products/{product['id']}"
        with self.client.get(url, name="/api/products/:id [detail]", catch_response=True) as resp:
            if resp.status_code == 200:
                resp.success()
            elif resp.status_code == 404:
                resp.success()  # aceitável — produto pode ter sido removido
            else:
                resp.failure(f"Expected 200/404, got {resp.status_code}")

    @task(2)
    def checkout_success(self):
        """
        Tenta comprar 1 unidade de um produto com estoque.
        Cada tentativa gera um idempotency_key único.
        """
        if not self.products:
            return
        product = random.choice(self.products)
        payload = {
            "product_id": product["id"],
            "quantity": 1,
            "idempotency_key": str(uuid.uuid4()),
        }
        with self.client.post(
            "/api/checkout",
            json=payload,
            name="/api/checkout [success]",
            catch_response=True,
        ) as resp:
            if resp.status_code in (201, 200):
                resp.success()
            elif resp.status_code == 409:
                # Estoque esgotou durante o teste — aceitável
                resp.success()
            elif resp.status_code == 503:
                # ERP falhou (esperado: 20% de chance) — não conta como erro
                resp.success()
            else:
                resp.failure(f"Unexpected status: {resp.status_code}")

    @task(1)
    def checkout_invalid(self):
        """
        Envia payload inválido — verifica que a API retorna 400.
        """
        payload = {
            "product_id": "nao-e-numero",
            "quantity": 0,
            "idempotency_key": "chave-invalida",
        }
        with self.client.post(
            "/api/checkout",
            json=payload,
            name="/api/checkout [validation error]",
            catch_response=True,
        ) as resp:
            if resp.status_code == 400:
                resp.success()
            else:
                resp.failure(f"Expected 400, got {resp.status_code}")

    @task(1)
    def idempotency_replay(self):
        """
        Reenvia a mesma idempotency_key — verifica que a API retorna o resultado cacheado.
        """
        if not self.products:
            return
        product = random.choice(self.products)
        shared_key = str(uuid.uuid4())
        payload = {
            "product_id": product["id"],
            "quantity": 1,
            "idempotency_key": shared_key,
        }
        # Primeira chamada
        self.client.post("/api/checkout", json=payload, name="/api/checkout [idempotency 1st]")
        # Segunda chamada — deve retornar cacheado
        with self.client.post(
            "/api/checkout",
            json=payload,
            name="/api/checkout [idempotency replay]",
            catch_response=True,
        ) as resp:
            if resp.status_code in (200, 201, 503):
                data = resp.json()
                if data.get("meta", {}).get("idempotent_replay"):
                    resp.success()
                elif resp.status_code == 503:
                    resp.success()  # ERP falhou, sem replay
                else:
                    resp.failure("Esperava idempotent_replay=true na resposta")
            else:
                resp.failure(f"Unexpected status: {resp.status_code}")

    @task(1)
    def health_check(self):
        """Verifica saúde da API."""
        with self.client.get("/api/health", name="/api/health", catch_response=True) as resp:
            if resp.status_code == 200 and resp.json().get("status") == "ok":
                resp.success()
            else:
                resp.failure("Health check failed")


class ConcurrentBuyerUser(HttpUser):
    """
    Simula compra simultânea do mesmo produto — estressa o controle de estoque.
    Usado junto com ShopperUser para detectar overselling.
    """
    wait_time = between(0.1, 0.5)
    weight = 2  # menos instâncias que ShopperUser

    TARGET_PRODUCT_ID = 1  # produto fixo para maximizar contenção

    @task
    def concurrent_checkout(self):
        payload = {
            "product_id": self.TARGET_PRODUCT_ID,
            "quantity": 1,
            "idempotency_key": str(uuid.uuid4()),
        }
        with self.client.post(
            "/api/checkout",
            json=payload,
            name="/api/checkout [concurrent stress]",
            catch_response=True,
        ) as resp:
            if resp.status_code in (201, 200, 409, 503):
                resp.success()
            else:
                resp.failure(f"Unexpected status: {resp.status_code}")


# ── Hooks de relatório ───────────────────────────────────────────────────────

@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    stats = environment.stats
    total = stats.total
    print("\n" + "=" * 60)
    print("RESUMO DO TESTE DE PERFORMANCE")
    print("=" * 60)
    print(f"  Requisições totais : {total.num_requests}")
    print(f"  Falhas             : {total.num_failures}")
    print(f"  RPS médio          : {total.current_rps:.1f}")
    print(f"  Latência p50       : {total.get_response_time_percentile(0.50):.0f}ms")
    print(f"  Latência p95       : {total.get_response_time_percentile(0.95):.0f}ms")
    print(f"  Latência p99       : {total.get_response_time_percentile(0.99):.0f}ms")
    print("=" * 60)
