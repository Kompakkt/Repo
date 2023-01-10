describe('Explore', () => {
  it('should visit explore page', () => {
    cy.visit('/explore');
    cy.location().url().should('contain', 'explore');
  })
})
