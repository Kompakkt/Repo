import {Component, OnInit} from '@angular/core';

import {IModel} from '../../interfaces';
import {ContentProviderService} from '../../services/content-provider.service';

@Component({
  selector: 'app-object-overview',
  templateUrl: './object-overview.component.html',
  styleUrls: ['./object-overview.component.scss'],
})
export class ObjectOverviewComponent implements OnInit {

  public models: IModel[] = [];

  constructor(public content: ContentProviderService) {
    this.content.ModelsObservable
      .subscribe(newModels => {
        this.models = newModels.filter(_model => _model.online);
      });
  }

  ngOnInit() {
  }

}
