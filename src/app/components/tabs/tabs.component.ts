import { Component, computed, effect, input, output, signal, WritableSignal } from '@angular/core';
import { TranslatePipe } from 'src/app/pipes';

export type Tab = {
  label: string;
  value: string;
  selected?: WritableSignal<boolean>;
  icon?: string;
  disabled?: boolean;
};

@Component({
  selector: 'app-tabs',
  imports: [TranslatePipe],
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss',
})
export class TabsComponent {
  __tabs = input.required<Tab[]>({ alias: 'tabs' });
  tabs = computed(() => this.__tabs().map((t, i) => ({ ...t, selected: signal(i === 0) })));

  initialSelectedTab = input<string>();

  constructor() {
    effect(() => {
      const initialTab = this.initialSelectedTab();
      if (!initialTab) return;
      const tab = this.tabs().find(t => t.value === initialTab);
      if (tab) this.select(tab);
    });
  }

  selectedTab = computed(() => this.tabs().find(t => t.selected()));
  selectChange = output<Tab>();
  select(tab: Tab) {
    if (tab.disabled) return;
    this.tabs().forEach(t => t.selected.set(false));
    tab.selected?.set(true);
    this.selectChange.emit(tab);
  }
}
