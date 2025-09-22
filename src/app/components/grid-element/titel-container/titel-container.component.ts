import { Component, input } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-titel-container',
  imports: [MatIconModule],
  templateUrl: './titel-container.component.html',
  styleUrl: './titel-container.component.scss',
})
export class TitelContainerComponent {
  name = input<String>();
  icon = input<String>();
  count = input<Number>();
  private = input<boolean>();
  iconStyle = input<String>();
}
