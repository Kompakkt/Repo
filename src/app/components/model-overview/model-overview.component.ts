import {Component, OnInit} from '@angular/core';

import {ContentProviderService} from '../../services/content-provider.service';
import {IModel} from '../../interfaces';

@Component({
  selector: 'app-model-overview',
  templateUrl: './model-overview.component.html',
  styleUrls: ['./model-overview.component.scss']
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
