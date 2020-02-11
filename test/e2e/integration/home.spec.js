describe("Explore", () => {
    it("should visit home page", () => {
        cy.visit("/home");
    });

    it("should open up a login modal on click", () => {
        cy.get('#navbar #btn-login').click();

        cy.get('#username').type('W. Dyer');
        cy.get('#password').type('m1sk4t0nIkk');
        cy.get('#btn-cancel').click();
    });
});
