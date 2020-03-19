import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  isCompilation,
  isEntity,
  ICompilation,
  IEntity,
} from '@kompakkt/shared';

@Component({
  selector: 'app-detail-page',
  templateUrl: './detail-page.component.html',
  styleUrls: ['./detail-page.component.scss'],
})
export class DetailPageComponent implements OnDestroy {
  private type = '';
  private routeSubscription: Subscription;
  public viewerUrl = '';
  public element: IEntity | ICompilation | undefined;

  constructor(private route: ActivatedRoute) {
    this.routeSubscription = this.route.data.subscribe(newData => {
      if (newData && newData.type) {
        this.type = newData.type;
      }
    });
  }

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
    console.log('Update viewer url: ', this.viewerUrl);
    this.viewerUrl = event;
  }

  public updateSelectedElement(event: IEntity | ICompilation | undefined) {
    console.log('Update selected element: ', event);
    if (isEntity(event)) {
      this.type = 'entity';
    } else if (isCompilation(event)) {
      this.type = 'compilation';
    }

    this.element = event;
  }
}
