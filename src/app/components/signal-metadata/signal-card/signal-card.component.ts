import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-signal-card',
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './signal-card.component.html',
  styleUrl: './signal-card.component.scss',
})
export class SignalCardComponent {
  showEdit = input(true);
  showRemove = input(true);

  editClicked = output<void>();
  removeClicked = output<void>();

  showActions = computed(() => this.showEdit() || this.showRemove());
}
