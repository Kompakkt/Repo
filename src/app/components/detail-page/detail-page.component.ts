import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-detail-page',
  templateUrl: './detail-page.component.html',
  styleUrls: ['./detail-page.component.scss'],
})
export class DetailPageComponent implements OnInit, OnDestroy {
  private type = '';
  private routeSubscription: Subscription;
  public viewerUrl = '';

  constructor(private route: ActivatedRoute) {
    this.routeSubscription = this.route.data.subscribe(newData => {
      if (newData && newData.type) {
        this.type = newData.type;
      }
    });
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.routeSubscription.unsubscribe();
  }

  get isEntity() {
    return this.type === 'entity';
  }

  get isCompilation() {
    return this.type === 'compilation';
  }

  public updateViewerUrl(event: any) {
    this.viewerUrl = event;
    console.log(this.viewerUrl);
  }
}
