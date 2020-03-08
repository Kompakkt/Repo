describe("Explore", () => {
    it("should visit home page", () => {
        cy.visit("/home");
        cy.location('pathname').should('eq', '/home')
    });
});
