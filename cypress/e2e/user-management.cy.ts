import { faker } from '@faker-js/faker';

describe('User Management and Authentication', () => {
  const prename = faker.name.firstName();
  const surname = faker.name.lastName();
  const username = faker.internet.userName(prename, surname);
  const email = faker.internet.email();
  const password = faker.internet.password();

  before(() => {
    cy.clearCookies();
  });

  beforeEach(() => {
    cy.intercept('POST', 'user-management/register').as('register');
    cy.intercept('POST', 'user-management/login').as('login');

    const { baseUrl } = Cypress.config();
    cy.visit(baseUrl + '/home');
  });

  describe('Registration', () => {
    it('Should be able to register a new account', () => {
      cy.get('#navbar a#register').click();
      cy.wait(1000);

      cy.get('app-register-dialog input[name=mail]').type(email);
      cy.get('app-register-dialog input[name=prename]').type(prename);
      cy.get('app-register-dialog input[name=surname]').type(surname);
      cy.get('app-register-dialog input[name=username]').type(username);
      cy.get('app-register-dialog input[name=password').type(password);
      cy.get('app-register-dialog input[name=passwordRepeat').type(password);
      cy.get('app-register-dialog button#create-account-button').click();

      cy.wait('@register').then(({ response }) => {
        expect(response?.statusCode).to.equal(201);
        expect(response?.body['status']).to.equal('OK');
      });
    });

    it('Should display error message when trying to register with existing email', () => {
      cy.get('#navbar a#register').click();
      cy.wait(1000);

      const prename = faker.name.firstName();
      const surname = faker.name.lastName();
      const password = faker.internet.password();

      cy.get('app-register-dialog input[name=mail]').type(email);
      cy.get('app-register-dialog input[name=prename]').type(prename);
      cy.get('app-register-dialog input[name=surname]').type(surname);
      cy.get('app-register-dialog input[name=username]').type(username);
      cy.get('app-register-dialog input[name=password').type(password);
      cy.get('app-register-dialog input[name=passwordRepeat').type(password);
      cy.get('app-register-dialog button#create-account-button').click();

      cy.wait('@register').then(({ response }) => {
        expect(response?.statusCode).to.equal(409);
        cy.get('app-register-dialog div.errors').should('exist');
      });
    });
  });

  describe('Logging in', () => {
    it('Should display error message when trying to login with incorrect credentials', () => {
      cy.get('#navbar a#login').click();
      cy.wait(1000);

      cy.get('app-auth-dialog input[name="username"]').type('fake@example.com');
      cy.get('app-auth-dialog input[name="password"]').type('fakepassword');
      cy.get('app-auth-dialog button#btn-login').click();

      cy.wait('@login').then(({ response }) => {
        expect(response?.statusCode).to.equal(401);
        cy.get('app-auth-dialog div.errors').should('exist');
      });
    });

    it('Should be able to login with correct credentials', () => {
      cy.get('#navbar a#login').click();
      cy.wait(1000);

      cy.get('app-auth-dialog input[name="username"]').type(username);
      cy.get('app-auth-dialog input[name="password"]').type(password);
      cy.get('app-auth-dialog button#btn-login').click();

      cy.wait('@login').then(({ response }) => {
        expect(response?.statusCode).to.equal(200);
        expect(response?.body['_id']).not.to.be.empty;
      });
    });
  });

  describe('Profile', () => {
    before(() => {
      cy.intercept('POST', 'user-management/login').as('login');

      const { baseUrl } = Cypress.config();
      cy.visit(baseUrl + '/home');

      cy.get('#navbar a#login').click();
      cy.wait(1000);

      cy.get('app-auth-dialog input[name="username"]').type(username);
      cy.get('app-auth-dialog input[name="password"]').type(password);
      cy.get('app-auth-dialog button#btn-login').click();

      cy.wait('@login');
    });

    it('Visit the users profile', () => {
      cy.get('#navbar a[href="/profile"]').click();
      cy.wait(1000);

      cy.location().url().should('contain', 'profile');
      cy.get('div#profile-page-content').should('exist');
    });
  });
});
