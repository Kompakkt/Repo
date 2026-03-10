import { Component, computed, inject, Input, signal, TemplateRef } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SelectionService } from 'src/app/services/selection.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { CommonModule } from '@angular/common';
import { AccountService } from 'src/app/services';
import { toSignal } from '@angular/core/rxjs-interop';
import { ExploreCategory } from 'src/app/pages/explore/shared-types';

@Component({
  selector: 'app-selection-tab',
  imports: [CommonModule, MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './selection-tab.component.html',
  styleUrl: './selection-tab.component.scss',
  standalone: true,
})
export class SelectionTab {
  @Input() actionsTemplate: TemplateRef<unknown> | null = null;
  @Input() isCollections: boolean = false;
  public selectionService = inject(SelectionService);
  private account = inject(AccountService);

  public isAuthenticated = toSignal(this.account.isAuthenticated$);

  constructor() {}
}
