import { ViewContainerRef } from '@angular/core';
import { input } from '@angular/core';
import { output } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { ElementRef } from '@angular/core';
import { inject } from '@angular/core';
import { Directive } from '@angular/core';
import { ExtenderSlotEvent, ExtenderSlotManager } from '@kompakkt/plugins/extender';
import { Observable } from 'rxjs';

@Directive({ selector: '[extendSlot]' })
export class ExtenderSlotDirective implements OnInit, OnDestroy {
  #viewContainerRef = inject(ViewContainerRef);
  #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  extendSlot = input<string | undefined>();
  dataObservable = input<Observable<unknown>>();
  slotBehaviour = input<'append' | 'prepend' | 'replace'>();
  event = output<ExtenderSlotEvent>();

  ngOnInit() {
    const slotName = this.extendSlot();
    const slotBehaviour = this.slotBehaviour() ?? 'append';
    const dataObservable = this.dataObservable();
    const viewContainerRef = this.#viewContainerRef;
    const elementRef = this.#elementRef;

    if (!slotName) {
      throw new Error('extendSlot directive requires a slot name');
    }

    const slotEvents = ExtenderSlotManager.registerSlot({
      slotName,
      slotBehaviour,
      elementRef,
      viewContainerRef,
      dataObservable,
    });

    slotEvents.subscribe(event => {
      this.event.emit(event);
    });
  }

  ngOnDestroy() {
    const slotName = this.extendSlot();
    if (!slotName) return;
    ExtenderSlotManager.unregisterSlot(slotName);
  }
}
