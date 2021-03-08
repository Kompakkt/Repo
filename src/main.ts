import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (window && document) {
  // Prevent accidentally opening a file in the window when dragging & dropping
  window.ondragover = window.ondrop = (event: DragEvent) => event.preventDefault();
  document.ondragover = document.ondrop = (event: DragEvent) => event.preventDefault();
}

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err));
