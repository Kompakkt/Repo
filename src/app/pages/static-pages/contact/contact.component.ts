import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslatePipe } from 'src/app/pipes';
import { ExtenderSlotDirective } from '@kompakkt/extender';

@Component({
    selector: 'app-contact',
    templateUrl: './contact.component.html',
    styleUrls: ['./contact.component.scss'],
    imports: [TranslatePipe, ExtenderSlotDirective]
})
export class ContactComponent implements OnInit {
  constructor(
    private translatePipe: TranslatePipe,
    private titleService: Title,
    private metaService: Meta,
  ) {}

  ngOnInit() {
    this.titleService.setTitle('Kompakkt – ' + this.translatePipe.transform('Contact'));
    this.metaService.updateTag({
      name: 'description',
      content: 'Kompakkt contact informations.',
    });
  }
}
