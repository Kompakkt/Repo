import { Component, inject, TemplateRef, input } from '@angular/core';
import { SelectionService } from 'src/app/services/selection.service';
import { SelectionBox } from 'src/app/components/selection/selection-box/selection-box.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-selection-container',
  templateUrl: './selection-container.component.html',
  styleUrls: ['./selection-container.component.scss'],
  standalone: true,
  imports: [SelectionBox, MatIconModule, MatButtonModule],
})
export class SelectionContainerComponent {
  actionsTemplate = input.required<TemplateRef<unknown>>();
  public selectionService = inject(SelectionService);

  public onMouseDown(event: MouseEvent) {
    this.selectionService.onMouseDown(event);
  }
}
