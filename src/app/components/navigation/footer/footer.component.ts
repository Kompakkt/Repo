import { Component } from '@angular/core';
import { TranslateService } from './../../../services/translate/translate.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  constructor(private translate: TranslateService) {
    this.translate.use(window.navigator.language.split('-')[0]);
  }
}
