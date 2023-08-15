import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateService } from './../../../services/translate/translate.service';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
})
export class ContactComponent implements OnInit {
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
    const translateSet = ['Contact'];
    this.translateItems = await this.translate.loadFromFile(translateSet);
  }

  ngOnInit() {
    this.titleService.setTitle('Kompakkt – ' + this.translateItems[0]);
    this.metaService.updateTag({
      name: 'description',
      content: 'Kompakkt contact informations.',
    });
  }
}
