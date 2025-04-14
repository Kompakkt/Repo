import {
  AfterContentChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  effect,
  HostBinding,
} from '@angular/core';
import { animate, group, query, style, transition, trigger } from '@angular/animations';

import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import {
  AccountService,
  QueryActionService,
  SnackbarService,
  TranslateService,
} from 'src/app/services';
import { FooterComponent } from './components/navigation/footer/footer.component';
import { NavbarComponent } from './components/navigation/navbar/navbar.component';
import { SidenavListComponent } from './components/navigation/sidenav-list/sidenav-list.component';
import { CustomBrandingPlugin } from '@kompakkt/plugin-custom-branding';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    trigger('routeTransition', [
      transition('* <=> *', [
        query(':enter, :leave', style({ position: 'fixed', width: '100%' }), {
          optional: true,
        }),
        group([
          query(':leave', [style({ opacity: 1 }), animate('280ms ease', style({ opacity: 0 }))], {
            optional: true,
          }),
          query(':enter', [style({ opacity: 0 }), animate('280ms ease', style({ opacity: 1 }))], {
            optional: true,
          }),
        ]),
      ]),
    ]),
  ],
  imports: [
    MatSidenavContainer,
    MatSidenav,
    SidenavListComponent,
    MatSidenavContent,
    NavbarComponent,
    RouterOutlet,
    FooterComponent,
  ],
})
export class AppComponent implements AfterViewInit, AfterContentChecked {
  #account = inject(AccountService);
  #snackbar = inject(SnackbarService);
  #queryAction = inject(QueryActionService);
  #changeDetector = inject(ChangeDetectorRef);
  #translationService = inject(TranslateService);
  #customBrandingPlugin = inject<CustomBrandingPlugin>(CustomBrandingPlugin.providerToken);
  #customPrimaryColor = 'var(--brand-color);';

  constructor() {
    effect(() => {
      const settings = this.#customBrandingPlugin.settings();

      if (settings.customBrandColors) {
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
