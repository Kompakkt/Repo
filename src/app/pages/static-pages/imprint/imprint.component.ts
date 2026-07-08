import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ExtenderSlotDirective } from 'src/app/directives/extender-slot.directive';
import { TranslatePipe } from 'src/app/pipes';

@Component({
  selector: 'app-imprint',
  templateUrl: './imprint.component.html',
  styleUrls: ['./imprint.component.scss'],
  imports: [ExtenderSlotDirective],
})
export class ImprintComponent implements OnInit {
  constructor(
    private translatePipe: TranslatePipe,
    private titleService: Title,
    private metaService: Meta,
  ) {}

  ngOnInit() {
    this.titleService.setTitle('Kompakkt – ' + this.translatePipe.transform('Imprint'));
    this.metaService.updateTag({
      name: 'description',
      content: 'Kompakkt imprint.',
    });
  }
}
