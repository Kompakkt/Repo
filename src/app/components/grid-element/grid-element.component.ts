import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatMenu } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';

import {
  isAnnotation,
  isCompilation,
  isEntity,
  isResolved,
  IAnnotation,
  ICompilation,
  IEntity,
  IMetaDataDigitalEntity,
} from '@kompakkt/shared';

import { ExploreEntityDialogComponent } from '../../dialogs/explore-entity/explore-entity-dialog.component';
import { ExploreCompilationDialogComponent } from '../../dialogs/explore-compilation-dialog/explore-compilation-dialog.component';

@Component({
  selector: 'app-grid-element',
  templateUrl: './grid-element.component.html',
  styleUrls: ['./grid-element.component.scss'],
})
export class GridElementComponent {
  public isEntity = isEntity;
  public isCompilation = isCompilation;

  public icons = {
    audio: 'audiotrack',
    video: 'movie',
    image: 'image',
    model: 'language',
    collection: 'apps',
  };
  public mtype = {
    audio: 'Audio',
    video: 'Video',
    image: 'Image',
    model: '3D Model',
  };

  @Input()
  public disableNavigationOnClick = false;

  @Input()
  public disableTypeInfo = false;

  @Input()
  public element: undefined | ICompilation | IEntity;

  @Input()
  public quickAddToCollectionMenu: undefined | MatMenu;

  @Output()
  public updateSelectedObject = new EventEmitter<string>();

  constructor(private dialog: MatDialog) {}

  public getTooltipContent = (element: IEntity | ICompilation) => {
    const title = element.name;
    let description = (isEntity(element) && isResolved(element)
      ? (element.relatedDigitalEntity as IMetaDataDigitalEntity).description
      : isCompilation(element)
      ? element.description
      : ''
    ).trim();
    description =
      description.length > 300 ? `${description.slice(0, 297)}…` : description;

    return `${description}`;
  };

  public getBackgroundColor = (element: IEntity) => {
    return `rgba(${Object.values(element.settings.background.color)
      .slice(0, 3)
      .join(',')}, 0.2)`;
  };

  public getImageSource(element: IEntity | ICompilation) {
    return isEntity(element)
      ? element.settings.preview
      : (Object.values(element.entities)[0] as IEntity).settings.preview;
  }

  public getImageSources(element: ICompilation) {
    const sources: string[] = [];
    for (let entity of Object.values(element.entities)) {
      const preview = (entity as IEntity)?.settings?.preview ?? undefined;
      if (!preview) continue;
      sources.push(preview);
    }
    return sources.slice(0, 4);
  }

  public isRecentlyAnnotated = (element: ICompilation) => {
    for (const anno of Object.values(element.annotations)) {
      if (!isAnnotation(anno)) continue;
      const sliced = anno._id.toString().slice(0, 8);
      const date = new Date(parseInt(sliced, 16) * 1000).getTime();
      if (date >= Date.now() - 86400000) return true;
    }
    return false;
  };

  public isPasswordProtected(element: ICompilation) {
    if (!element.password) return false;
    return true;
  }

  public getCollectionQuantityIcon = (element: ICompilation) => {
    const length = Object.keys(element.entities).length;
    return length > 9 ? 'filter_9_plus' : `filter_${length}`;
  };

  public getCollectionQuantityText = (element: ICompilation) =>
    `This collection contains ${Object.keys(element.entities).length} objects`;

  public openExploreDialog(element: IEntity | ICompilation) {
    if (!element) return;

    if (isCompilation(element)) {
      // tslint:disable-next-line:no-non-null-assertion
      const eId = (Object.values(element.entities)[0] as IEntity)._id;

      this.dialog.open(ExploreCompilationDialogComponent, {
        data: {
          collectionId: element._id,
          entityId: eId,
        },
        id: 'explore-compilation-dialog',
      });
    } else {
      this.dialog.open(ExploreEntityDialogComponent, {
        data: element._id,
        id: 'explore-entity-dialog',
      });
    }
  }

  public selectObject(id: string) {
    this.updateSelectedObject.emit(id);
  }
}
