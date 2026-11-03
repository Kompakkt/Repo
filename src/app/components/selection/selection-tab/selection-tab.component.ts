import { Component, inject, input, TemplateRef, ChangeDetectionStrategy } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SelectionService } from 'src/app/services/selection.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { NgTemplateOutlet } from '@angular/common';
import { AccountService } from 'src/app/services/account.service';

@Component({
  selector: 'app-selection-tab',
  imports: [MatButtonModule, MatIconModule, TranslatePipe, NgTemplateOutlet],
  templateUrl: './selection-tab.component.html',
  styleUrl: './selection-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class SelectionTab {
  actionsTemplate = input<TemplateRef<unknown> | null>(null);
  isCollections = input(false);

  selectionService = inject(SelectionService);
  account = inject(AccountService);
}
