import { Component, EventEmitter, Output, computed, inject, input } from '@angular/core';
import { MatMenu } from '@angular/material/menu';

import { MatIconModule } from '@angular/material/icon';
import { ICompilation, IEntity, isCompilation, isEntity } from 'src/common';
import { IsEntityPipe } from '../../pipes/is-entity.pipe';
import { EntityMediaContainerComponent } from './entity-media-container/entity-media-container.component';
import { CollectionMediaContainerComponent } from './collection-media-container/collection-media-container.component';
import { IsCompilationPipe } from '../../pipes/is-compilation.pipe';
import { TitleContainerComponent } from './title-container/title-container.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from 'src/app/pipes';
import { Router } from '@angular/router';

@Component({
  selector: 'app-grid-element',
  templateUrl: './grid-element.component.html',
  styleUrls: ['./grid-element.component.scss'],
  imports: [
    MatIconModule,
    MatTooltipModule,
    IsEntityPipe,
    EntityMediaContainerComponent,
    CollectionMediaContainerComponent,
    IsCompilationPipe,
    TitleContainerComponent,
    TranslatePipe,
  ],
  host: {
    '[class.cursor-pointer]': 'enableNavigationOnClick()',
    '(dblclick)': 'onDblclick()',
  },
})
export class GridElementComponent {
  disableNavigationOnClick = input(false);
  disableTypeInfo = input(false);
  quickAddToCollectionMenu = input<MatMenu>();
  #router = inject(Router);

  @Output()
  updateSelectedObject = new EventEmitter<string>();

  element = input<ICompilation | IEntity>();

  enableNavigationOnClick = computed(() => {
    const element = this.element();
    return isEntity(element) || isCompilation(element);
  });

  isPrivate = computed(() => {
    const element = this.element();
    return isEntity(element) && !element.online;
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

  public selectObject(id: string) {
    this.updateSelectedObject.emit(id.toString());
  }

  public onDblclick() {
    if (this.enableNavigationOnClick()) {
      const element = this.element();
      if (isEntity(element)) this.#router.navigate(['/entity', element._id]);
      if (isCompilation(element)) this.#router.navigate(['/compilation', element._id]);
    }
  }
}
