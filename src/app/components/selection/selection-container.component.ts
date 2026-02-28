import { CommonModule } from '@angular/common';
import { Component, inject, computed, TemplateRef, Input } from '@angular/core';
import { IEntity } from 'src/common';
import { SelectionService } from 'src/app/services/selection.service';
import { SelectionBox } from 'src/app/components/selection/selection-box/selection-box.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-selection-container',
  templateUrl: './selection-container.component.html',
  styleUrls: ['./selection-container.component.scss'],
  standalone: true,
  imports: [CommonModule, SelectionBox, MatIconModule, MatButtonModule],
})
export class SelectionContainerComponent {
  @Input() actionsTemplate!: TemplateRef<unknown>;
  public selectionService = inject(SelectionService);

  public onMouseDown(event: MouseEvent) {
    this.selectionService.onMouseDown(event);
  }
}
