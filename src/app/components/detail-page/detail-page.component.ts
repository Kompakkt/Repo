import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { ICompilation, IEntity } from '../../interfaces';

@Component({
  selector: 'app-detail-page',
  templateUrl: './detail-page.component.html',
  styleUrls: ['./detail-page.component.scss'],
})
export class DetailPageComponent implements OnInit, OnDestroy {
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
    console.log('Update viewer url: ', this.viewerUrl);
    this.viewerUrl = event;
  }

  public updateSelectedElement(event: IEntity | ICompilation | undefined) {
    console.log('Update selected element: ', event);
    this.element = event;
  }
}
