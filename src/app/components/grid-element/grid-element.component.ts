import { Component, EventEmitter, Output, input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';

import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { ExploreCompilationDialogComponent, ExploreEntityDialogComponent } from 'src/app/dialogs';
import {
  ICompilation,
  IEntity,
  ObjectId,
  isAnnotation,
  isCompilation,
  isEntity,
  isResolvedEntity,
} from 'src/common';
import { environment } from 'src/environment';
import { IsCompilationPipe } from '../../pipes/is-compilation.pipe';
import { IsEntityPipe } from '../../pipes/is-entity.pipe';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AnimatedImageComponent } from '../animated-image/animated-image.component';

@Component({
  selector: 'app-grid-element',
  templateUrl: './grid-element.component.html',
  styleUrls: ['./grid-element.component.scss'],
  standalone: true,
  imports: [
    AnimatedImageComponent,
    RouterLink,
    MatTooltip,
    MatIcon,
    MatMenuTrigger,
    TranslatePipe,
    IsEntityPipe,
    IsCompilationPipe,
  ],
})
export class GridElementComponent {
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

  public disableNavigationOnClick = input(false);

  public disableTypeInfo = input(false);

  public element = input.required<ICompilation | IEntity>();

  public quickAddToCollectionMenu = input<MatMenu>();

  @Output()
  public updateSelectedObject = new EventEmitter<string>();

  constructor(private dialog: MatDialog) {}

  get tooltipContent() {
    const element = this.element();
    let description = '';
    if (isResolvedEntity(element)) description = element.relatedDigitalEntity.description;
    else if (isCompilation(element)) description = element.description;
    description = description.trim();
    description = description.length > 300 ? `${description.slice(0, 297)}…` : description;
    return `${description}`;
  }

  private entityToRGB(entity: IEntity) {
    return Object.values(entity.settings.background.color).slice(0, 3).join(',');
  }

  get backgroundColor() {
    const element = this.element();
    return isEntity(element)
      ? `rgba(${this.entityToRGB(element)}, 0.2)`
      : `rgba(${this.entityToRGB(Object.values(element.entities)[0] as IEntity)}, 0.2)`;
  }

  get imageSource() {
    const element = this.element();
    return (
      environment.server_url +
      (isEntity(element)
        ? element?.settings.preview
        : (Object.values(element.entities)[0] as IEntity).settings.preview)
    );
  }

  get imageSources() {
    const element = this.element();
    if (!isCompilation(element)) return [];
    const sources: string[] = [];
    for (const entity of Object.values(element.entities)) {
      const preview = (entity as IEntity)?.settings?.preview ?? undefined;
      if (!preview) continue;
      sources.push(environment.server_url + preview);
    }
    return sources.slice(0, 4);
  }

  get isRecentlyAnnotated() {
    const element = this.element();
    for (const anno of Object.values(element.annotations)) {
      if (!isAnnotation(anno)) continue;
      const sliced = anno._id.toString().slice(0, 8);
      const date = new Date(parseInt(sliced, 16) * 1000).getTime();
      if (date >= Date.now() - 86400000) return true;
    }
    return false;
  }

  get isPasswordProtected() {
    const element = this.element();
    return isCompilation(element) && !!element.password;
  }

  get collectionQuantityIcon() {
    const element = this.element();
    if (!isCompilation(element)) return '';
    const length = Object.keys(element.entities).length;
    return length > 9 ? 'filter_9_plus' : `filter_${length}`;
  }

  get collectionQuantityText() {
    const element = this.element();
    if (!isCompilation(element)) return 'Not a collection';
    return `This collection contains ${Object.keys(element.entities).length} objects`;
  }

  get mediaType() {
    const element = this.element();
    return isEntity(element) ? element.mediaType : '';
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
