import {Component, OnInit} from '@angular/core';
import {TrackingService} from './services/tracking.service';

import {environment} from '../environments/environment';
import {filter} from "rxjs/operators";
import {NavigationEnd, Router} from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {

  title = 'Kompakkt';

  constructor(private tracking: TrackingService,
              private router: Router) {
  }

  ngOnInit() {

    if (environment.tracking) {

      this.tracking.init();

      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd),
      )
        .subscribe(() => {
          if (this.router.url) {
            this.tracking.trackPageView(this.router.url);
          }
        });
    }
  }

}
