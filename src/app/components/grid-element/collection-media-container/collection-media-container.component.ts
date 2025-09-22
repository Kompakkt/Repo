import { Component, computed, input, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AnimatedImageComponent } from '../../animated-image/animated-image.component';
import { ICompilation, IEntity, isEntity } from 'src/common';
import { MatTooltip } from '@angular/material/tooltip';
import { getServerUrl } from 'src/app/util/get-server-url';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { IsCompilationPipe } from '../../../pipes/is-compilation.pipe';

@Component({
  selector: 'app-collection-media-container',
  imports: [AnimatedImageComponent, MatTooltip, RouterModule, TranslatePipe, IsCompilationPipe],
  templateUrl: './collection-media-container.component.html',
  styleUrl: './collection-media-container.component.scss',
})
export class CollectionMediaContainerComponent {
  element = input.required<ICompilation>();
  link = input<boolean>(false);

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
