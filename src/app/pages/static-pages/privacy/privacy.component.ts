import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslatePipe } from 'src/app/pipes';
import { ExtenderSlotManager } from '@kompakkt/plugins/extender';
import { viewChild } from '@angular/core';
import { ElementRef } from '@angular/core';
import { ViewContainerRef } from '@angular/core';
import { inject } from '@angular/core';

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.scss'],
  imports: [TranslatePipe],
})
export class PrivacyComponent implements OnInit {
  constructor(
    private translatePipe: TranslatePipe,
    private titleService: Title,
    private metaService: Meta,
  ) {}

  privacyPageSlotRef = viewChild.required<ElementRef<HTMLElement>>('privacyPageSlot');
  #viewContainerRef = inject(ViewContainerRef);
  ngOnInit() {
    this.titleService.setTitle('Kompakkt – ' + this.translatePipe.transform('Privacy'));
    this.metaService.updateTag({
      name: 'description',
      content: 'Kompakkt privacy.',
    });
    ExtenderSlotManager.registerSlot({
      slotName: 'privacy-page',
      slotBehaviour: 'replace',
      elementRef: this.privacyPageSlotRef(),
      viewContainerRef: this.#viewContainerRef,
    });
  }
}
