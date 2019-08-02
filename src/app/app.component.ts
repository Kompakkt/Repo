import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';

import { environment } from '../environments/environment';

import { TrackingService } from './services/tracking.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'Kompakkt';

  constructor(
    private tracking: TrackingService,
    public translate: TranslateService,
    private router: Router,
  ) {
    translate.setDefaultLang('de');
    translate.use('de');
    translate.addLangs(['en']);
  }

  ngOnInit() {
    if (environment.tracking) {
      this.tracking.init();

      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(() => {
          if (this.router.url) {
            this.tracking.trackPageView(this.router.url);
          }
        });
    }
  }
}
