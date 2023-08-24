import { Component, HostBinding, Input } from '@angular/core';

@Component({
  selector: 'app-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.scss'],
})
export class GridComponent {
  @Input('itemsPerRow') itemsPerRow = 4;

  @Input('gapSizePx') gapSizePx = 8;

  @HostBinding('style.--items-per-row') get itemsPerRowStyle() {
    return this.itemsPerRow;
  }

  @HostBinding('style.--gap-size') get gapSizeStyle() {
    return this.gapSizePx + 'px';
  }
}
