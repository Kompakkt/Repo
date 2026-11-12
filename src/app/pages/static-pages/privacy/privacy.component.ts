import { Component, OnInit, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ExtenderSlotDirective } from 'src/app/directives/extender-slot.directive';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.scss'],
  imports: [TranslatePipe, ExtenderSlotDirective],
})
export class PrivacyComponent implements OnInit {
  #translatePipe = inject(TranslatePipe);
  #titleService = inject(Title);
  #metaService = inject(Meta);

  ngOnInit() {
    this.#titleService.setTitle('Kompakkt – ' + this.#translatePipe.transform('Privacy'));
    this.#metaService.updateTag({ name: 'description', content: 'Kompakkt privacy.' });
  }
}
