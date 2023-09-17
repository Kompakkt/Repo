import { Component } from '@angular/core';
import { TranslateService } from '../../../services/translate.service';
import { TranslatePipe } from '~pipes';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
})
export class AboutComponent {
  constructor(private translatePipe: TranslatePipe) {}
}
