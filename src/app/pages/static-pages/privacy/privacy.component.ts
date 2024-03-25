import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslatePipe } from 'src/app/pipes';
import { TranslatePipe as TranslatePipe_1 } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.scss'],
  standalone: true,
  imports: [TranslatePipe_1],
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
