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
    '[class.cursor-pointer]': 'link()',
    '(click)': 'onClick()',
  },
})
export class EntityMediaContainerComponent {
  element = input.required<IEntity>();
  link = input<boolean>(false);

  #router = inject(Router);
  onClick() {
    if (this.link()) this.#router.navigate(['/entity', this.element()._id]);
  }

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
