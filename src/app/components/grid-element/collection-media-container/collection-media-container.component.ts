import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { AnimatedImageDirective } from 'src/app/directives/animated-image.directive';
import { getServerUrl } from 'src/app/util/get-server-url';
import { ICompilation, IEntity, isEntity } from 'src/common';

@Component({
  selector: 'app-collection-media-container',
  imports: [AnimatedImageDirective],
  templateUrl: './collection-media-container.component.html',
  styleUrl: './collection-media-container.component.scss',
  host: {
    '[class.cursor-pointer]': 'link()',
    '[style.--bg-color]': 'backgroundColor()',
    '[class.single-image]': 'imageSources().length === 1',
    '(click)': 'onClick()',
  },
})
export class CollectionMediaContainerComponent {
  element = input.required<ICompilation>();
  link = input<boolean>(false);

  #router = inject(Router);
  onClick() {
    if (this.link()) this.#router.navigate(['/compilation', this.element()._id]);
  }

  private entityToRGB(entity: IEntity) {
    return Object.values(entity.settings.background.color).slice(0, 3).join(',');
  }

  backgroundColor = computed(() => {
    const element = this.element();
    const entities = Object.values(element.entities).filter(e => isEntity(e));
    const firstEntity = entities.at(0);
    return firstEntity ? `rgba(${this.entityToRGB(firstEntity)}, 0.2)` : 'rgba(0, 0, 0, 0.2)';
  });

  imageSources = computed(() => {
    const element = this.element();
    const sources: string[] = [];
    for (const entity of Object.values(element.entities)) {
      const preview = (entity as IEntity)?.settings?.preview ?? undefined;
      if (!preview) continue;
      sources.push(getServerUrl(preview));
    }
    return sources.slice(0, 4);
  });
}
