import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatMenu } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';

import {
  isAnnotation,
  isCompilation,
  isEntity,
  isResolvedEntity,
  ICompilation,
  IEntity,
  ObjectId,
} from 'src/common';
import { environment } from 'src/environments/environment';
import { ExploreEntityDialogComponent, ExploreCompilationDialogComponent } from 'src/app/dialogs';

@Component({
  selector: 'app-grid-element',
  templateUrl: './grid-element.component.html',
  styleUrls: ['./grid-element.component.scss'],
})
export class GridElementComponent {
  public isEntity = isEntity;
  public isCompilation = isCompilation;

  public icons: { [key: string]: string } = {
    audio: 'audiotrack',
    video: 'movie',
    image: 'image',
    model: 'language',
    collection: 'apps',
  };
  public mtype: { [key: string]: string } = {
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
  public element!: ICompilation | IEntity;

  @Input()
  public quickAddToCollectionMenu: undefined | MatMenu;

  @Output()
  public updateSelectedObject = new EventEmitter<string>();

  constructor(private dialog: MatDialog) {}

  get tooltipContent() {
    let description = '';
    if (isResolvedEntity(this.element)) description = this.element.relatedDigitalEntity.description;
    else if (isCompilation(this.element)) description = this.element.description;
    description = description.trim();
    description = description.length > 300 ? `${description.slice(0, 297)}…` : description;
    return `${description}`;
  }

  get backgroundColor() {
    return isEntity(this.element)
      ? `rgba(${Object.values(this.element?.settings.background.color).slice(0, 3).join(',')}, 0.2)`
      : 'transparent';
  }

  get imageSource() {
    return (
      environment.server_url +
      (isEntity(this.element)
        ? this.element?.settings.preview
        : (Object.values(this.element.entities)[0] as IEntity).settings.preview)
    );
  }

  get imageSources() {
    if (!isCompilation(this.element)) return [];
    const sources: string[] = [];
    for (let entity of Object.values(this.element.entities)) {
      const preview = (entity as IEntity)?.settings?.preview ?? undefined;
      if (!preview) continue;
      sources.push(environment.server_url + preview);
    }
    return sources.slice(0, 4);
  }

  get isRecentlyAnnotated() {
    for (const anno of Object.values(this.element.annotations)) {
      if (!isAnnotation(anno)) continue;
      const sliced = anno._id.toString().slice(0, 8);
      const date = new Date(parseInt(sliced, 16) * 1000).getTime();
      if (date >= Date.now() - 86400000) return true;
    }
    return false;
  }

  get isPasswordProtected() {
    return isCompilation(this.element) && !!this.element.password;
  }

  get collectionQuantityIcon() {
    if (!isCompilation(this.element)) return '';
    const length = Object.keys(this.element.entities).length;
    return length > 9 ? 'filter_9_plus' : `filter_${length}`;
  }

  get collectionQuantityText() {
    if (!isCompilation(this.element)) return 'Not a collection';
    return `This collection contains ${Object.keys(this.element.entities).length} objects`;
  }

  get mediaType() {
    return isEntity(this.element) ? this.element.mediaType : '';
  }

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

  public selectObject(id: string | ObjectId) {
    this.updateSelectedObject.emit(id.toString());
  }
}
