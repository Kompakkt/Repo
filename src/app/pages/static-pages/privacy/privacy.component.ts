import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ExtenderSlotDirective } from 'src/app/directives/extender-slot.directive';
import { NgxFluentPipe } from '@apappas1129/ngx-fluent';

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [NgxFluentPipe, ExtenderSlotDirective],
})
export class PrivacyComponent implements OnInit {
  #NgxFluentPipe = inject(NgxFluentPipe);
  #titleService = inject(Title);
  #metaService = inject(Meta);

  ngOnInit() {
    this.#titleService.setTitle('Kompakkt – ' + this.#NgxFluentPipe.transform('Privacy'));
    this.#metaService.updateTag({ name: 'description', content: 'Kompakkt privacy.' });
  }
}
