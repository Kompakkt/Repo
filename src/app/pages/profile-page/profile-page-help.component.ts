import { Component } from '@angular/core';
import { TranslateService } from './../../services/translate/translate.service';

@Component({
  selector: 'app-profile-page-help',
  templateUrl: './profile-page-help.component.html',
  styleUrls: ['./profile-page-help.component.scss'],
})
export class ProfilePageHelpComponent {
  constructor(private translate: TranslateService) {
    this.translate.use(window.navigator.language.split('-')[0]);
  }
}
