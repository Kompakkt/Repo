import { Component, computed, inject, Input, TemplateRef } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SelectionService } from 'src/app/services/selection.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-selection-tab',
  imports: [CommonModule, MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './selection-tab.component.html',
  styleUrl: './selection-tab.component.scss',
  standalone: true,
})
export class SelectionTab {
  @Input() actionsTemplate: TemplateRef<unknown> | null = null;
  public selectionService = inject(SelectionService);
}
