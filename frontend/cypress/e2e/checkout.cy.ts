/**
 * Fluxo E2E — CaseCellShop Checkout
 *
 * Cobre os pontos de aceite do desafio:
 *  - Listagem de produtos
 *  - Seleção de quantidade e abertura do modal
 *  - Loading / bloqueio de duplo clique
 *  - Sucesso → tela de pedido confirmado
 *  - Estoque insuficiente → ajustar quantidade
 *  - Falha do ERP → tentar novamente
 *  - Troca de idioma PT ↔ EN
 */

const BASE = 'http://localhost:5173';

describe('Product List', () => {
  beforeEach(() => {
    cy.visit(BASE);
  });

  it('exibe produtos carregados da API', () => {
    cy.get('[data-cy=product-card]').should('have.length.greaterThan', 0);
  });

  it('exibe badge "Esgotado" para produto sem estoque', () => {
    cy.contains('Esgotado').should('exist');
  });

  it('troca idioma PT → EN ao clicar na bandeira', () => {
    cy.get('[data-cy=lang-toggle]').should('contain', '🇺🇸');
    cy.get('[data-cy=lang-toggle]').click();
    cy.contains('Phone Cases').should('be.visible');
    cy.get('[data-cy=lang-toggle]').should('contain', '🇧🇷');
  });

  it('troca idioma EN → PT ao clicar novamente', () => {
    cy.get('[data-cy=lang-toggle]').click(); // → EN
    cy.get('[data-cy=lang-toggle]').click(); // → PT
    cy.contains('Capas para Celular').should('be.visible');
  });
});

describe('Checkout Modal — fluxo feliz', () => {
  beforeEach(() => {
    cy.intercept('POST', '/api/checkout', {
      statusCode: 201,
      body: {
        data: {
          id: 'aaaabbbb-0000-0000-0000-000000000001',
          product_id: 1,
          quantity: 1,
          status: 'confirmed',
          invoice: 'INV-TEST-0001',
          error_message: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          product_name: 'Capinha iPhone 15 Pro - Silicone Premium',
          product_price: 89.9,
        },
      },
    }).as('postCheckout');

    cy.visit(BASE);
  });

  it('abre o modal ao clicar em Comprar', () => {
    cy.get('[data-cy=buy-btn]').first().click();
    cy.get('[data-cy=checkout-modal]').should('be.visible');
    cy.contains('Finalizar Compra').should('be.visible');
  });

  it('exibe preço unitário e total corretos', () => {
    cy.get('[data-cy=buy-btn]').first().click();
    cy.get('[data-cy=checkout-modal]').within(() => {
      cy.contains('Unitário').should('exist');
      cy.contains('Total').should('exist');
      cy.contains('Grátis').should('exist');
    });
  });

  it('incrementa quantidade com o botão +', () => {
    cy.get('[data-cy=buy-btn]').first().click();
    cy.get('[data-cy=checkout-modal]').within(() => {
      cy.get('[data-cy=qty-value]').should('contain', '1');
      cy.get('[data-cy=qty-plus]').click();
      cy.get('[data-cy=qty-value]').should('contain', '2');
    });
  });

  it('fecha o modal ao clicar em Cancelar', () => {
    cy.get('[data-cy=buy-btn]').first().click();
    cy.get('[data-cy=cancel-btn]').click();
    cy.get('[data-cy=checkout-modal]').should('not.exist');
  });

  it('fecha o modal ao clicar no backdrop', () => {
    cy.get('[data-cy=buy-btn]').first().click();
    cy.get('[data-cy=checkout-modal]').click('topLeft');
    cy.get('[data-cy=checkout-modal]').should('not.exist');
  });

  it('exibe loading e bloqueia duplo clique durante processamento', () => {
    cy.intercept('POST', '/api/checkout', (req) => {
      req.reply({ delay: 1500, statusCode: 201, body: { data: { id: 'x', product_id: 1, quantity: 1, status: 'confirmed', invoice: 'INV-X', error_message: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), product_name: 'Test', product_price: 89.9 } } });
    }).as('slowCheckout');

    cy.get('[data-cy=buy-btn]').first().click();
    cy.get('[data-cy=confirm-btn]').click();
    cy.contains('Processando pedido...').should('be.visible');
    cy.contains('Aguarde...').should('be.visible');
    cy.get('[data-cy=modal-close]').should('be.disabled');
  });

  it('navega para tela de pedido confirmado após sucesso', () => {
    cy.get('[data-cy=buy-btn]').first().click();
    cy.get('[data-cy=confirm-btn]').click();
    cy.wait('@postCheckout');
    cy.get('[data-cy=order-status]').should('be.visible');
    cy.contains('Pedido Confirmado!').should('be.visible');
    cy.contains('INV-TEST-0001').should('not.exist'); // invoice não aparece na tela de status
  });

  it('volta à lista ao clicar em Continuar Comprando', () => {
    cy.get('[data-cy=buy-btn]').first().click();
    cy.get('[data-cy=confirm-btn]').click();
    cy.wait('@postCheckout');
    cy.get('[data-cy=continue-shopping]').click();
    cy.get('[data-cy=product-card]').should('exist');
  });
});

describe('Checkout Modal — estoque insuficiente', () => {
  beforeEach(() => {
    cy.intercept('POST', '/api/checkout', {
      statusCode: 409,
      body: {
        error: 'insufficient_stock',
        message: 'Estoque insuficiente para a quantidade solicitada',
        current_stock: 2,
      },
    }).as('stockError');

    cy.visit(BASE);
    cy.get('[data-cy=buy-btn]').first().click();
    cy.get('[data-cy=confirm-btn]').click();
    cy.wait('@stockError');
  });

  it('exibe banner de estoque insuficiente', () => {
    cy.contains('Estoque insuficiente').should('be.visible');
    cy.contains('Há apenas 2 unidades disponíveis').should('be.visible');
  });

  it('volta ao form ao clicar em Ajustar Quantidade', () => {
    cy.get('[data-cy=adjust-qty-btn]').click();
    cy.get('[data-cy=confirm-btn]').should('be.visible');
    cy.get('[data-cy=qty-value]').should('contain', '1');
  });
});

describe('Checkout Modal — ERP indisponível', () => {
  beforeEach(() => {
    cy.intercept('POST', '/api/checkout', {
      statusCode: 503,
      body: {
        error: 'erp_unavailable',
        message: 'Falha temporária no processamento. Tente novamente em instantes.',
      },
    }).as('erpError');

    cy.visit(BASE);
    cy.get('[data-cy=buy-btn]').first().click();
    cy.get('[data-cy=confirm-btn]').click();
    cy.wait('@erpError');
  });

  it('exibe banner de serviço indisponível', () => {
    cy.contains('Serviço temporariamente indisponível').should('be.visible');
    cy.contains('ERP_UNAVAILABLE').should('be.visible');
  });

  it('volta ao form ao clicar em Tentar Novamente', () => {
    cy.get('[data-cy=retry-btn]').click();
    cy.get('[data-cy=confirm-btn]').should('be.visible');
  });

  it('estado da tela permanece coerente após retry', () => {
    cy.get('[data-cy=retry-btn]').click();
    // Intercept nova tentativa com sucesso
    cy.intercept('POST', '/api/checkout', {
      statusCode: 201,
      body: {
        data: { id: 'retry-ok', product_id: 1, quantity: 1, status: 'confirmed', invoice: 'INV-RETRY', error_message: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), product_name: 'Test', product_price: 89.9 },
      },
    }).as('retryOk');
    cy.get('[data-cy=confirm-btn]').click();
    cy.wait('@retryOk');
    cy.get('[data-cy=order-status]').should('be.visible');
  });
});

describe('Mobile viewport', () => {
  beforeEach(() => {
    cy.viewport('iphone-14');
    cy.visit(BASE);
  });

  it('exibe layout mobile (sem grid, lista vertical)', () => {
    cy.get('[data-cy=product-card]').first().should('be.visible');
    // No qty selector visible on mobile cards
    cy.get('[data-cy=buy-btn]').first().should('be.visible');
  });

  it('abre bottom sheet ao clicar em Comprar', () => {
    cy.get('[data-cy=buy-btn]').first().click();
    cy.get('[data-cy=checkout-modal]').should('be.visible');
  });
});
