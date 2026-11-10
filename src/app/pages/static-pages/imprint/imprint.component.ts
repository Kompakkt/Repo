import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ExtenderSlotDirective } from 'src/app/directives/extender-slot.directive';
import { NgxFluentPipe } from '@apappas1129/ngx-fluent';

@Component({
  selector: 'app-imprint',
  templateUrl: './imprint.component.html',
  styleUrls: ['./imprint.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ExtenderSlotDirective],
})
export class ImprintComponent implements OnInit {
  #NgxFluentPipe = inject(NgxFluentPipe);
  #titleService = inject(Title);
  #metaService = inject(Meta);

  ngOnInit() {
    this.#titleService.setTitle('Kompakkt – ' + this.#NgxFluentPipe.transform('Imprint'));
    this.#metaService.updateTag({
      name: 'description',
      content: 'Kompakkt imprint.',
    });
  }
}
