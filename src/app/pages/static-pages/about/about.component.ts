import { Component } from '@angular/core';
import { TranslateService } from './../../../services/translate/translate.service';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
})
export class AboutComponent {
  constructor(private translate: TranslateService) {
    this.translate.use(window.navigator.language.split('-')[0]);
  }
}
