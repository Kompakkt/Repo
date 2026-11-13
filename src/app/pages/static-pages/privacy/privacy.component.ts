import { Component, OnInit, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NgxFluentPipe } from '@apappas1129/ngx-fluent';
import { ExtenderSlotDirective } from 'src/app/directives/extender-slot.directive';

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.scss'],
  imports: [ExtenderSlotDirective, NgxFluentPipe],
})
export class PrivacyComponent implements OnInit {
  #titleService = inject(Title);
  #metaService = inject(Meta);

  ngOnInit() {
    this.#titleService.setTitle('Kompakkt – Privacy');
    this.#metaService.updateTag({ name: 'description', content: 'Kompakkt privacy.' });
  }
}
