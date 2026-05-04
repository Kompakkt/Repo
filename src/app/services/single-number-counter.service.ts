import { Injectable, signal, WritableSignal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CounterService {
  private counters = new Map<string, WritableSignal<number>>();
  private newItems = new Set<object>();

  trackAsNew(item: object) {
    this.newItems.add(item);
  }

  isNew(item: object): boolean {
    return this.newItems.has(item);
  }

  removeTracking(item: object) {
    this.newItems.delete(item);
  }

  getCounter(key: string): WritableSignal<number> {
    if (!this.counters.has(key)) {
      const newSignal = signal(0);
      this.counters.set(key, newSignal);
      return newSignal;
    }
    return this.counters.get(key)!;
  }

  incrementCounter(key: string) {
    const counter = this.getCounter(key);
    if (!counter) return;
    counter.update(value => value + 1);
  }

  decrementCounter(key: string) {
    const counter = this.getCounter(key);
    if (!counter) return;
    counter.update(value => Math.max(0, value - 1));
  }

  resetAll(): void {
    this.counters.forEach(counter => counter.set(0));
    this.newItems.clear();
  }
}
