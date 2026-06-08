// Comandos globais e configurações para todos os testes E2E

Cypress.Commands.add('openCheckout', (productIndex = 0) => {
  cy.get('[data-cy=product-card]').eq(productIndex).within(() => {
    cy.get('[data-cy=buy-btn]').click();
  });
  cy.get('[data-cy=checkout-modal]').should('be.visible');
});

declare global {
  namespace Cypress {
    interface Chainable {
      openCheckout(productIndex?: number): Chainable<void>;
    }
  }
}
