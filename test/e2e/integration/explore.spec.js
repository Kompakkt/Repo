describe("Explore", () => {
    it("should visit explore page", () => {
        cy.visit("/explore");
        cy.location('pathname').should('eq', '/explore')
    });
});
