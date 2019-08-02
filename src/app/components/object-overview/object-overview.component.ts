import {Component, OnInit} from '@angular/core';

import {IEntity} from '../../interfaces';
import {ContentProviderService} from '../../services/content-provider.service';

@Component({
  selector: 'app-object-overview',
  templateUrl: './object-overview.component.html',
  styleUrls: ['./object-overview.component.scss'],
})
export class ObjectOverviewComponent implements OnInit {

  public entities: IEntity[] = [];

  constructor(public content: ContentProviderService) {
    this.content.EntitiesObservable
      .subscribe(newEntities => {
        this.entities = newEntities.filter(_entity => _entity.finished && _entity.online);
      });
  }

  ngOnInit() {
  }

}
