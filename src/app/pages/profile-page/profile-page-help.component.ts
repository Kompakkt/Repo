import { Component } from '@angular/core';
import { TranslateService } from '../../services/translate.service';
import { TranslatePipe } from '~pipes';

@Component({
  selector: 'app-profile-page-help',
  templateUrl: './profile-page-help.component.html',
  styleUrls: ['./profile-page-help.component.scss'],
})
export class ProfilePageHelpComponent {
  constructor(private translatePipe: TranslatePipe) {}
}
