import {
  AfterContentChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  effect,
  ElementRef,
  HostBinding,
  inject,
  signal,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import { CustomBrandingPlugin } from '@kompakkt/plugins/custom-branding';
import { FooterComponent } from './components/navigation/footer/footer.component';
import { NavbarComponent } from './components/navigation/navbar/navbar.component';
import { SidenavContainerComponent } from './components/sidenav-container/sidenav-container.component';
import { NotificationAreaComponent } from './components/notification-area/notification-area.component';
import { environment } from 'src/environment';
import { MatButtonModule } from '@angular/material/button';
import { AccountService } from './services/account.service';
import { SnackbarService } from './services/snackbar.service';
import { QueryActionService } from './services/query-action.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    MatSidenavModule,
    MatButtonModule,
    NavbarComponent,
    RouterOutlet,
    FooterComponent,
    SidenavContainerComponent,
    NotificationAreaComponent,
  ],
})
export class AppComponent implements AfterViewInit, AfterContentChecked {
  #account = inject(AccountService);
  #snackbar = inject(SnackbarService);
  #queryAction = inject(QueryActionService);
  #changeDetector = inject(ChangeDetectorRef);
  #customBrandingPlugin = inject<CustomBrandingPlugin>(CustomBrandingPlugin.providerToken, {
    optional: true,
  });
  #customPrimaryColor = 'var(--brand-color);';

  navbar = viewChild.required<ElementRef, ElementRef>('navbar', { read: ElementRef });
  footer = viewChild.required<ElementRef, ElementRef>('footer', { read: ElementRef });
  contentHeights = signal({ navbar: '67px', footer: '48px' });

  @HostBinding('style.--navbar-height') get navbarHeight() {
    return this.contentHeights().navbar;
  }
  @HostBinding('style.--footer-height') get footerHeight() {
    return this.contentHeights().footer;
  }

  showDevInstanceWarning = signal(
    'isDevelopmentInstance' in environment && !!environment.isDevelopmentInstance,
  );

  constructor() {
    effect(() => {
      const settings = this.#customBrandingPlugin?.settings();

      if (settings?.customBrandColors) {
        this.#customPrimaryColor = settings.customBrandColors.primary;
      }
    });
  }

  ngAfterViewInit() {
    const createObserver = (element: HTMLElement, property: 'navbar' | 'footer') => {
      const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
          const height = entry.contentRect.height;
          this.contentHeights.update(h => ({
            ...h,
            [property]: `${height}px`,
          }));
        }
      });
      observer.observe(element);
      return observer;
    };

    createObserver(this.navbar().nativeElement, 'navbar');
    createObserver(this.footer().nativeElement, 'footer');

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
