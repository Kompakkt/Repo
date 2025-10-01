import { Component, EventEmitter, Output, computed, input } from '@angular/core';
import { MatMenu } from '@angular/material/menu';

import { MatIcon, MatIconModule } from '@angular/material/icon';
import { ICompilation, IEntity, isCompilation, isEntity, isGroup } from 'src/common';
import { IsEntityPipe } from '../../pipes/is-entity.pipe';
import { EntityMediaContainerComponent } from './entity-media-container/entity-media-container.component';
import { CollectionMediaContainerComponent } from './collection-media-container/collection-media-container.component';
import { IGroup } from 'src/common';
import { IsCompilationPipe } from '../../pipes/is-compilation.pipe';
import { GroupMediaContainerComponent } from './group-media-container/group-media-container.component';
import { IsGroupPipe } from '../../pipes/is-group.pipe';
import { TitleContainerComponent } from './title-container/title-container.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from 'src/app/pipes';

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
    GroupMediaContainerComponent,
    IsGroupPipe,
    TitleContainerComponent,
    TranslatePipe,
  ],
})
export class GridElementComponent {
  disableNavigationOnClick = input(false);
  disableTypeInfo = input(false);
  quickAddToCollectionMenu = input<MatMenu>();

  @Output()
  updateSelectedObject = new EventEmitter<string>();

  element = input<ICompilation | IEntity | IGroup>();
  isPrivate = computed(() => {
    const element = this.element();
    return isEntity(element) && !element.online;
  });

  annotationCount = computed(() => {
    const element = this.element();
    if (isGroup(element)) return 0;
    if (!element || !element.annotations) return 0;

    return Object.values(element.annotations).length;
  });

  entitiesCount = computed(() => {
    const element = this.element();
    if (!isCompilation(element) || !element.entities) return 0;
    return Object.values(element.entities).length;
  });

  groupMembersCount = computed(() => {
    const element = this.element();
    if (!isGroup(element)) return 0;
    return [element.owners, ...element.members].length;
  });

  public selectObject(id: string) {
    this.updateSelectedObject.emit(id.toString());
  }
}
