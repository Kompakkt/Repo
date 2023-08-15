import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateService } from './../../../services/translate/translate.service';

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.scss'],
})
export class PrivacyComponent implements OnInit {
  translateItems: string[] = [];
  constructor(
    private translate: TranslateService,
    private titleService: Title,
    private metaService: Meta,
  ) {
    this.translate.use(window.navigator.language.split('-')[0]);
    this.translateStrings();
  }

  async translateStrings() {
    const translateSet = ['Privacy'];
    this.translateItems = await this.translate.loadFromFile(translateSet);
  }

  ngOnInit() {
    this.titleService.setTitle('Kompakkt – ' + this.translateItems[0]);
    this.metaService.updateTag({
      name: 'description',
      content: 'Kompakkt privacy.',
    });
  }
}
