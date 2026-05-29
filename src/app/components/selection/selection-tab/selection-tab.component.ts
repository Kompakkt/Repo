import { Component, inject, input, TemplateRef } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SelectionService } from 'src/app/services/selection.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { NgTemplateOutlet } from '@angular/common';
import { AccountService } from 'src/app/services';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-selection-tab',
  imports: [MatButtonModule, MatIconModule, TranslatePipe, NgTemplateOutlet],
  templateUrl: './selection-tab.component.html',
  styleUrl: './selection-tab.component.scss',
  standalone: true,
})
export class SelectionTab {
  actionsTemplate = input<TemplateRef<unknown> | null>(null);
  isCollections = input(false);

  public selectionService = inject(SelectionService);
  private account = inject(AccountService);

  public isAuthenticated = toSignal(this.account.isAuthenticated$);

  constructor() {}
}
