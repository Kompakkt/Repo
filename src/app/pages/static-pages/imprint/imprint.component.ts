import { Component, OnInit, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ExtenderSlotDirective } from 'src/app/directives/extender-slot.directive';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';

@Component({
  selector: 'app-imprint',
  templateUrl: './imprint.component.html',
  styleUrls: ['./imprint.component.scss'],
  imports: [ExtenderSlotDirective],
})
export class ImprintComponent implements OnInit {
  #translatePipe = inject(TranslatePipe);
  #titleService = inject(Title);
  #metaService = inject(Meta);

  ngOnInit() {
    this.#titleService.setTitle('Kompakkt – ' + this.#translatePipe.transform('Imprint'));
    this.#metaService.updateTag({
      name: 'description',
      content: 'Kompakkt imprint.',
    });
  }
}
