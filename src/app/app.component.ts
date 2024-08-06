import { animate, group, query, style, transition, trigger } from '@angular/animations';
import { AfterContentChecked, AfterViewInit, ChangeDetectorRef, Component } from '@angular/core';

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
  standalone: true,
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
  title = 'Kompakkt';
  constructor(
    private account: AccountService,
    private snackbar: SnackbarService,
    private queryAction: QueryActionService,
    private changeDetector: ChangeDetectorRef,
    private translationService: TranslateService,
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

  ngAfterContentChecked(): void {
    this.changeDetector.detectChanges();
  }
}
