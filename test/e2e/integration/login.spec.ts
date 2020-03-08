describe('Login', () => {
  it('should visit contact page', () => {
    cy.visit('/contact');
    cy.location('pathname').should('eq', '/contact');
  });

  it('should fail with incorrect user credentials', () => {
    cy.get('#navbar #login').click();

    cy.get('#username').type('pjeffies');
    cy.get('#password').type('firewalkwithme');
    cy.get('#btn-login > .mat-button-wrapper').click();

    cy.get('#login-failed')
      .should('be.visible')
      .and('contain', 'Login failed');
  });

  it('should visit profile page after successful login', () => {
    cy.get('#username')
      .clear()
      .type('pjeffries');
    cy.get('#password')
      .clear()
      .type('firewalkwithme');
    cy.get('#btn-login > .mat-button-wrapper').click();

    cy.visit('/profile');
    cy.location('pathname').should('eq', '/profile');
    cy.get('#profile-page-content h1').should('contain', 'User Profile');
  });

  it('should logout current user', () => {
    cy.get('#navbar #logout').click();
    cy.get('#profile-page-container h2')
      .should('be.visible')
      .and('contain', 'No data available for the current user.');
  });
});
