import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { AnimatedImageDirective } from 'src/app/directives/animated-image.directive';
import { getServerUrl } from 'src/app/util/get-server-url';
import { IEntity } from 'src/common';

@Component({
  selector: 'app-entity-media-container',
  imports: [AnimatedImageDirective],
  templateUrl: './entity-media-container.component.html',
  styleUrl: './entity-media-container.component.scss',
  host: {
    '[style.--bg-color]': 'backgroundColor()',
  },
})
export class EntityMediaContainerComponent {
  element = input.required<IEntity>();

  videoPreview = computed(() => {
    const element = this.element();
    if (!element) return undefined;
    const previewVideo =
      element.settings.previewVideo?.slice(1) ??
      element.settings.preview.replaceAll('.webp', '.webm');
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
    return `rgba(${this.entityToRGB(element)})`;
  });

  updateVideoPreview(videoEl: HTMLVideoElement, event: MouseEvent) {
    if (videoEl.networkState != videoEl.NETWORK_IDLE) return;

    const { width } = videoEl.getBoundingClientRect();
    const { layerX } = event;

    // We need to offset the effect by 1 frame. The content has 19 frames, so we need to calculate the duration of a single frame, to offset by
    const frameDuration = videoEl.duration / 19;
    const ratio = layerX / width;

    // Clamp between after first frame and rest of video
    videoEl.currentTime = Math.min(
      Math.max(ratio * videoEl.duration, frameDuration),
      videoEl.duration,
    );
  }

  resetVideoPreview(videoEl: HTMLVideoElement) {
    videoEl.currentTime = 0;
  }
}
