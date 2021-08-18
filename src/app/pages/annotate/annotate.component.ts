import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { IEntity, IDigitalEntity } from 'src/common';
import { environment } from 'src/environments/environment';
import { BackendService } from 'src/app/services';

@Component({
  selector: 'app-annotate',
  templateUrl: './annotate.component.html',
  styleUrls: ['./annotate.component.scss'],
})
export class AnnotateComponent implements OnInit {
  public entity: IEntity | undefined;
  public object: IDigitalEntity | undefined;
  public objectID: string | undefined;
  public viewerUrl: string;

  constructor(
    private route: ActivatedRoute,
    private backend: BackendService,
    private titleService: Title,
    private metaService: Meta,
  ) {
    this.viewerUrl = ``;
  }

  ngOnInit() {
    this.titleService.setTitle(`Kompakkt – Annotate`);
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
