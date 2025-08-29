import { Component, computed, input, Input } from '@angular/core';
import { AnimatedImageComponent } from '../../animated-image/animated-image.component';
import { RouterModule } from '@angular/router';
import { ICompilation, IEntity, isEntity } from 'src/common';
import { getServerUrl } from 'src/app/util/get-server-url';
import { IsEntityPipe } from '../../../pipes/is-entity.pipe';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-entity-media-container',
  imports: [AnimatedImageComponent, MatTooltip, RouterModule, IsEntityPipe, TranslatePipe],
  templateUrl: './entity-media-container.component.html',
  styleUrl: './entity-media-container.component.scss',
})
export class EntityMediaContainerComponent {
  element = input.required<IEntity>();
  link = input<boolean>(false);

  videoPreview = computed(() => {
    const element = this.element();
    if (!element) return undefined;
    const previewVideo = element.settings.previewVideo?.slice(1);
    return previewVideo ? getServerUrl(previewVideo) : undefined;
  });

  imageSource = computed(() => {
    const element = this.element();
    if (!element) return '';
    return getServerUrl(element?.settings.preview);
  });

  private entityToRGB(entity: IEntity) {
    return Object.values(entity.settings.background.color).slice(0, 3).join(',');
  }

  backgroundColor = computed(() => {
    const element = this.element();
    return `rgba(${this.entityToRGB(element)}, 0.2)`;
  });

  updateVideoPreview(videoEl: HTMLVideoElement, event: MouseEvent) {
    const { width } = videoEl.getBoundingClientRect();
    const { clientX } = event;
    videoEl.currentTime = videoEl.duration * (clientX / width);
  }

  resetVideoPreview(videoEl: HTMLVideoElement) {
    videoEl.currentTime = 0;
  }
}
