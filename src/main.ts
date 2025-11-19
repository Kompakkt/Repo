import { provideZoneChangeDetection } from "@angular/core";
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

if (window && document) {
  // Prevent accidentally opening a file in the window when dragging & dropping
  window.ondragover = window.ondrop = (event: DragEvent) => event.preventDefault();
  document.ondragover = document.ondrop = (event: DragEvent) => event.preventDefault();
}

bootstrapApplication(AppComponent, {...appConfig, providers: [provideZoneChangeDetection(), ...appConfig.providers]}).catch(err => console.error(err));
