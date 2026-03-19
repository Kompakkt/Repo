import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslatePipe } from 'src/app/pipes';
import { ExtenderSlotDirective } from '@kompakkt/plugins/extender';

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.scss'],
  imports: [TranslatePipe, ExtenderSlotDirective],
})
export class PrivacyComponent implements OnInit {
  constructor(
    private translatePipe: TranslatePipe,
    private titleService: Title,
    private metaService: Meta,
  ) {}

  ngOnInit() {
    this.titleService.setTitle('Kompakkt – ' + this.translatePipe.transform('Privacy'));
    this.metaService.updateTag({
      name: 'description',
      content: 'Kompakkt privacy.',
    });
  }
}
