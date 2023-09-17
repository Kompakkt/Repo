import { Component } from '@angular/core';
import { TranslateService } from '../../services/translate.service';
import { TranslatePipe } from '~pipes';

@Component({
  selector: 'app-notfound',
  templateUrl: './notfound.component.html',
  styleUrls: ['./notfound.component.scss'],
})
export class NotFoundComponent {
  constructor(private translatePipe: TranslatePipe) {}
}
