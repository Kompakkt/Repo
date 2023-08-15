import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { IEntity, IDigitalEntity } from 'src/common';
import { environment } from 'src/environments/environment';
import { BackendService } from 'src/app/services';
import { TranslateService } from './../../services/translate/translate.service';

@Component({
  selector: 'app-annotate',
  templateUrl: './annotate.component.html',
  styleUrls: ['./annotate.component.scss'],
})
export class AnnotateComponent implements OnInit {
  translateItems: string[] = [];

  public entity: IEntity | undefined;
  public object: IDigitalEntity | undefined;
  public objectID: string | undefined;
  public viewerUrl: string;

  constructor(
    private translate: TranslateService,
    private route: ActivatedRoute,
    private backend: BackendService,
    private titleService: Title,
    private metaService: Meta,
  ) {
    this.translate.use(window.navigator.language.split('-')[0]);
    this.translateStrings();
    this.viewerUrl = ``;
  }

  async translateStrings() {
    const translateSet = ['Annotate'];
    this.translateItems = await this.translate.loadFromFile(translateSet);
  }

  ngOnInit() {
    this.titleService.setTitle('Kompakkt – ' + this.translateItems[0]);
    this.metaService.updateTag({
      name: 'description',
      content: 'Annotate object.',
    });

    this.objectID = this.route.snapshot.paramMap.get('id') || undefined;
    const isCompilation = this.route.snapshot.paramMap.get('type') === 'compilation';

    const params: string[] = ['mode=annotation'];
    if (this.objectID) {
      params.push(isCompilation ? `compilation=${this.objectID}` : `entity=${this.objectID}`);
    }

    this.viewerUrl = `${environment.viewer_url}?${params.join('&')}`;

    if (this.objectID && !isCompilation) {
      this.backend
        .getEntity(this.objectID)
        .then(resultEntity => {
          this.entity = resultEntity;
          if (!resultEntity.relatedDigitalEntity) {
            throw new Error('Invalid object metadata.');
          }
          return this.backend.getEntityMetadata(resultEntity.relatedDigitalEntity._id);
        })
        .then(result => {
          this.object = result;
        })
        .catch(e => {
          this.object = undefined;
          console.error(e);
        });
    }

    console.log(this.viewerUrl);
  }
}
