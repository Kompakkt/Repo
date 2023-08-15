import { Component } from '@angular/core';
import { TranslateService } from './../../services/translate/translate.service';

@Component({
  selector: 'app-notfound',
  templateUrl: './notfound.component.html',
  styleUrls: ['./notfound.component.scss'],
})
export class NotFoundComponent {
  constructor(private translate: TranslateService) {
    this.translate.use(window.navigator.language.split('-')[0]);
  }
}
