describe("Explore", () => {
    it("should visit explore page", () => {
        cy.visit("/explor");
        cy.location('pathname').should('eq', '/explore')
    });
});
