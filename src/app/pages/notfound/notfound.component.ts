import { Component } from '@angular/core';
import { TranslatePipe } from 'src/app/pipes';
import { TranslatePipe as TranslatePipe_1 } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-notfound',
  templateUrl: './notfound.component.html',
  styleUrls: ['./notfound.component.scss'],
  standalone: true,
  imports: [TranslatePipe_1],
})
export class NotFoundComponent {
  constructor(private translatePipe: TranslatePipe) {}
}
