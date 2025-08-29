import { Component, EventEmitter, Output, computed, input } from '@angular/core';
import { MatMenu } from '@angular/material/menu';

import { MatIcon } from '@angular/material/icon';
import { ICompilation, IEntity, isCompilation, isEntity } from 'src/common';
import { IsEntityPipe } from '../../pipes/is-entity.pipe';
import { EntityMediaContainerComponent } from './entity-media-container/entity-media-container.component';
import { CollectionMediaContainerComponent } from './collection-media-container/collection-media-container.component';

@Component({
  selector: 'app-grid-element',
  templateUrl: './grid-element.component.html',
  styleUrls: ['./grid-element.component.scss'],
  imports: [
    MatIcon,
    IsEntityPipe,
    EntityMediaContainerComponent,
    CollectionMediaContainerComponent,
  ],
})
export class GridElementComponent {
  // icons = {
  //   audio: 'audiotrack',
  //   video: 'movie',
  //   image: 'image',
  //   model: 'language',
  //   collection: 'apps',
  // } as const;
  // mtype = {
  //   audio: 'Audio',
  //   video: 'Video',
  //   image: 'Image',
  //   model: '3D Model',
  // } as const;

  disableNavigationOnClick = input(false);
  disableTypeInfo = input(false);
  quickAddToCollectionMenu = input<MatMenu>();

  @Output()
  updateSelectedObject = new EventEmitter<string>();

  element = input<ICompilation | IEntity>();
  isPrivate = computed(() => {
    const element = this.element();
    return isEntity(element) && !element.online;
  });

  // tooltipContent = computed(() => {
  //   const element = this.element();
  //   let description = '';
  //   if (isResolvedEntity(element)) description = element.relatedDigitalEntity.description;
  //   else if (isCompilation(element)) description = element.description;
  //   description = description.trim();
  //   description = description.length > 300 ? `${description.slice(0, 297)}…` : description;
  //   return `${description}`;
  // });

  // isRecentlyAnnotated = computed(() => {
  //   const element = this.element();
  //   if (!element) return false;
  //   for (const anno of Object.values(element.annotations)) {
  //     if (!isAnnotation(anno)) continue;
  //     const sliced = anno._id.toString().slice(0, 8);
  //     const date = new Date(parseInt(sliced, 16) * 1000).getTime();
  //     if (date >= Date.now() - 86400000) return true;
  //   }
  //   return false;
  // });

  annotationCount = computed(() => {
    const element = this.element();
    if (!element || !element.annotations) return 0;

    return Object.values(element.annotations).length;
  });

  entitiesCount = computed(() => {
    const element = this.element();
    if (!isCompilation(element) || !element.entities) return 0;
    return Object.values(element.entities).length;
  });

  // isPasswordProtected = computed(() => {
  //   const element = this.element();
  //   return isCompilation(element) && !!element.password;
  // });

  // collectionQuantityIcon = computed(() => {
  //   const element = this.element();
  //   if (!isCompilation(element)) return '';
  //   const length = Object.keys(element.entities).length;
  //   return length > 9 ? 'filter_9_plus' : `filter_${length}`;
  // });

  // collectionQuantityText = computed(() => {
  //   const element = this.element();
  //   if (!isCompilation(element)) return 'Not a collection';
  //   return `This collection contains ${Object.keys(element.entities).length} objects`;
  // });

  // mediaType = computed(() => {
  //   const element = this.element();
  //   return isEntity(element) ? element.mediaType : '';
  // });

  // helpTooltip = computed(() => {
  //   const mediatype = this.mediaType();
  //   return this.mtype[mediatype as keyof typeof this.mtype] || 'Unknown media type';
  // });

  // helpIcon = computed(() => {
  //   const mediatype = this.mediaType();
  //   return this.icons[mediatype as keyof typeof this.icons] || 'help';
  // });

  // public openExploreDialog(element: IEntity | ICompilation) {
  //   if (!element) return;

  //   const compilation = isCompilation(element) ? element._id.toString() : undefined;
  //   const entity = compilation
  //     ? Object.keys((element as ICompilation).entities)[0].toString()
  //     : element._id.toString();

  //   this.#dialogHelper.openViewerDialog({
  //     compilation,
  //     entity,
  //     mode: 'explore',
  //   });
  // }

  public selectObject(id: string) {
    this.updateSelectedObject.emit(id.toString());
  }
}
