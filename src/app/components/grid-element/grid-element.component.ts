import { Component, EventEmitter, Output, computed, inject, input } from '@angular/core';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';

import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { DialogHelperService } from 'src/app/services';
import { getServerUrl } from 'src/app/util/get-server-url';
import {
  ICompilation,
  IEntity,
  isAnnotation,
  isCompilation,
  isEntity,
  isResolvedEntity,
} from 'src/common';
import { IsCompilationPipe } from '../../pipes/is-compilation.pipe';
import { IsEntityPipe } from '../../pipes/is-entity.pipe';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AnimatedImageComponent } from '../animated-image/animated-image.component';

@Component({
  selector: 'app-grid-element',
  templateUrl: './grid-element.component.html',
  styleUrls: ['./grid-element.component.scss'],
  imports: [AnimatedImageComponent, RouterLink, MatTooltip, MatIcon, TranslatePipe, IsEntityPipe],
})
export class GridElementComponent {
  #dialogHelper = inject(DialogHelperService);

  icons = {
    audio: 'audiotrack',
    video: 'movie',
    image: 'image',
    model: 'language',
    collection: 'apps',
  } as const;
  mtype = {
    audio: 'Audio',
    video: 'Video',
    image: 'Image',
    model: '3D Model',
  } as const;

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
  tooltipContent = computed(() => {
    const element = this.element();
    let description = '';
    if (isResolvedEntity(element)) description = element.relatedDigitalEntity.description;
    else if (isCompilation(element)) description = element.description;
    description = description.trim();
    description = description.length > 300 ? `${description.slice(0, 297)}…` : description;
    return `${description}`;
  });

  private entityToRGB(entity: IEntity) {
    return Object.values(entity.settings.background.color).slice(0, 3).join(',');
  }

  backgroundColor = computed(() => {
    const element = this.element();
    if (isEntity(element)) {
      return `rgba(${this.entityToRGB(element)}, 0.2)`;
    } else if (isCompilation(element)) {
      const entities = Object.values(element.entities).filter(e => isEntity(e));
      const firstEntity = entities.at(0);
      return firstEntity ? `rgba(${this.entityToRGB(firstEntity)}, 0.2)` : 'rgba(0, 0, 0, 0.2)';
    } else {
      return 'rgba(0, 0, 0, 0.2)';
    }
  });

  videoPreview = computed(() => {
    const element = this.element();
    if (!element) return false;
    if (!isEntity(element)) return false;
    const previewVideo = element.settings.previewVideo?.slice(1);
    return previewVideo ? getServerUrl(previewVideo) : false;
  });

  updateVideoPreview(videoEl: HTMLVideoElement, event: MouseEvent) {
    const { width } = videoEl.getBoundingClientRect();
    const { clientX } = event;
    videoEl.currentTime = videoEl.duration * (clientX / width);
  }

  resetVideoPreview(videoEl: HTMLVideoElement) {
    videoEl.currentTime = 0;
  }

  imageSource = computed(() => {
    const element = this.element();
    if (!element) return '';
    return getServerUrl(
      isEntity(element)
        ? element?.settings.preview
        : (Object.values(element.entities)[0] as IEntity).settings.preview,
    );
  });

  imageSources = computed(() => {
    const element = this.element();
    if (!isCompilation(element)) return [];
    const sources: string[] = [];
    for (const entity of Object.values(element.entities)) {
      const preview = (entity as IEntity)?.settings?.preview ?? undefined;
      if (!preview) continue;
      sources.push(getServerUrl(preview));
    }
    return sources.slice(0, 4);
  });

  isRecentlyAnnotated = computed(() => {
    const element = this.element();
    if (!element) return false;
    for (const anno of Object.values(element.annotations)) {
      if (!isAnnotation(anno)) continue;
      const sliced = anno._id.toString().slice(0, 8);
      const date = new Date(parseInt(sliced, 16) * 1000).getTime();
      if (date >= Date.now() - 86400000) return true;
    }
    return false;
  });

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

  isPasswordProtected = computed(() => {
    const element = this.element();
    return isCompilation(element) && !!element.password;
  });

  collectionQuantityIcon = computed(() => {
    const element = this.element();
    if (!isCompilation(element)) return '';
    const length = Object.keys(element.entities).length;
    return length > 9 ? 'filter_9_plus' : `filter_${length}`;
  });

  collectionQuantityText = computed(() => {
    const element = this.element();
    if (!isCompilation(element)) return 'Not a collection';
    return `This collection contains ${Object.keys(element.entities).length} objects`;
  });

  mediaType = computed(() => {
    const element = this.element();
    return isEntity(element) ? element.mediaType : '';
  });

  helpTooltip = computed(() => {
    const mediatype = this.mediaType();
    return this.mtype[mediatype as keyof typeof this.mtype] || 'Unknown media type';
  });

  helpIcon = computed(() => {
    const mediatype = this.mediaType();
    return this.icons[mediatype as keyof typeof this.icons] || 'help';
  });

  public openExploreDialog(element: IEntity | ICompilation) {
    if (!element) return;

    const compilation = isCompilation(element) ? element._id.toString() : undefined;
    const entity = compilation
      ? Object.keys((element as ICompilation).entities)[0].toString()
      : element._id.toString();

    this.#dialogHelper.openViewerDialog({
      compilation,
      entity,
      mode: 'explore',
    });
  }

  public selectObject(id: string) {
    this.updateSelectedObject.emit(id.toString());
  }
}
