import { Component, AfterViewInit } from '@angular/core';
import { transition, animate, query, style, trigger, group } from '@angular/animations';

import { AccountService, SnackbarService, QueryActionService } from './services';

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
export class AppComponent implements AfterViewInit {
  title = 'Kompakkt';
  constructor(
    private account: AccountService,
    private snackbar: SnackbarService,
    private queryAction: QueryActionService,
  ) {
    this.account.loginOrFetch().catch(err => {
      console.warn('No user', err);
    });

    console.info = (...args) => {
      this.snackbar.showInfo(args[0]);
    };
  }

  ngAfterViewInit() {
    this.queryAction.evaluateAction();
  }
}
