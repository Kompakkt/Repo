import { Component, computed, input } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { ICompilation, IEntity, IGroup, isEntity } from 'src/common';

@Component({
  selector: 'app-title-container',
  imports: [MatIconModule],
  templateUrl: './title-container.component.html',
  styleUrl: './title-container.component.scss',
  host: {
    '[class.private]': 'private()',
  },
})
export class TitleContainerComponent {
  element = input.required<IEntity | ICompilation | IGroup>();
  name = computed(() => this.element().name);
  private = computed(() => {
    const element = this.element();
    if (!isEntity(element)) return false;
    return !element.online;
  });
  icon = input.required<String>();
  count = input.required<Number>();
  iconStyle = input.required<String>();
}
