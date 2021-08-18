import { Component, OnInit } from '@angular/core';
import { transition, animate, query, style, trigger, group } from '@angular/animations';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import { TrackingService, AccountService, SnackbarService } from './services';

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
})
export class AppComponent implements OnInit {
  title = 'Kompakkt';
  constructor(
    private tracking: TrackingService,
    public translate: TranslateService,
    private router: Router,
    private account: AccountService,
    private snackbar: SnackbarService,
  ) {
    translate.setDefaultLang('en');
    translate.use('en');
    translate.addLangs(['de']);

    this.account.fetchUserData().catch(err => {
      console.warn('No user', err);
    });

    console.info = (...args) => {
      this.snackbar.showInfo(args[0]);
    };
  }

  ngOnInit() {
    if (environment.tracking) {
      this.tracking.init();

      this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
        if (this.router.url) {
          this.tracking.trackPageView(this.router.url);
        }
      });
    }
  }
}
