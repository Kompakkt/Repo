import {
  AfterContentChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  effect,
  HostBinding,
  inject,
} from '@angular/core';

import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import { CustomBrandingPlugin } from '@kompakkt/plugins/custom-branding';
import {
  AccountService,
  QueryActionService,
  SnackbarService,
  TranslateService,
} from 'src/app/services';
import { FooterComponent } from './components/navigation/footer/footer.component';
import { NavbarComponent } from './components/navigation/navbar/navbar.component';
import { SidenavListComponent } from './components/navigation/sidenav-list/sidenav-list.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],

  imports: [MatSidenavModule, SidenavListComponent, NavbarComponent, RouterOutlet, FooterComponent],
})
export class AppComponent implements AfterViewInit, AfterContentChecked {
  #account = inject(AccountService);
  #snackbar = inject(SnackbarService);
  #queryAction = inject(QueryActionService);
  #changeDetector = inject(ChangeDetectorRef);
  #translationService = inject(TranslateService);
  #customBrandingPlugin = inject<CustomBrandingPlugin>(CustomBrandingPlugin.providerToken, {
    optional: true,
  });
  #customPrimaryColor = 'var(--brand-color);';

  constructor() {
    effect(() => {
      const settings = this.#customBrandingPlugin?.settings();

      if (settings?.customBrandColors) {
        this.#customPrimaryColor = settings.customBrandColors.primary;
      }
    });
  }

  ngAfterViewInit() {
    this.#account.loginOrFetch().catch(err => {
      console.warn('No user', err);
    });

    console.info = (...args: Parameters<typeof console.info>) => {
      this.#snackbar.showInfo(args[0]);
    };

    this.#queryAction.evaluateAction();
  }

  ngAfterContentChecked(): void {
    this.#changeDetector.detectChanges();
  }

  @HostBinding('style.--brand-color') get brandColor() {
    return this.#customPrimaryColor;
  }
}
