import { Component, HostBinding, input } from '@angular/core';

@Component({
  selector: 'app-entity-grid',
  imports: [],
  templateUrl: './entity-grid.component.html',
  styleUrl: './entity-grid.component.scss',
})
export class EntityGridComponent {
  itemsPerRow = input<number>(4);

  @HostBinding('style.--items-per-row')
  get itemsPerRowStyle() {
    return this.itemsPerRow();
  }
}
