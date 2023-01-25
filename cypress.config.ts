import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {},
    // Repo URL when using Kompakkt Mono
    baseUrl: 'https://localhost:4200',
    chromeWebSecurity: false,
  },
});
