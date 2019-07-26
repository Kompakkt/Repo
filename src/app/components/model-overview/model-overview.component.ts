import {Component, OnInit} from '@angular/core';

import {IModel} from '../../interfaces';
import {ContentProviderService} from '../../services/content-provider.service';

@Component({
  selector: 'app-model-overview',
  templateUrl: './model-overview.component.html',
  styleUrls: ['./model-overview.component.scss'],
})
export class ModelOverviewComponent implements OnInit {

  public models: IModel[] = [];

  constructor(public content: ContentProviderService) {
    this.content.ModelsObservable
      .subscribe(newModels => {
        this.models = newModels.filter(_model => _model.online);
        console.log(this.models);
      });
  }

  ngOnInit() {
  }

}
