import { Component, inject, input, TemplateRef } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SelectionService } from 'src/app/services/selection.service';
import { NgxFluentPipe } from '@apappas1129/ngx-fluent';
import { NgTemplateOutlet } from '@angular/common';
import { AccountService } from 'src/app/services/account.service';

@Component({
  selector: 'app-selection-tab',
  imports: [MatButtonModule, MatIconModule, NgxFluentPipe, NgTemplateOutlet],
  templateUrl: './selection-tab.component.html',
  styleUrl: './selection-tab.component.scss',
})
export class SelectionTab {
  actionsTemplate = input<TemplateRef<unknown> | null>(null);
  isCollections = input(false);

  selectionService = inject(SelectionService);
  account = inject(AccountService);
}
