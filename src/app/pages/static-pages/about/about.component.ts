import { Component } from '@angular/core';
import { TranslatePipe } from 'src/app/pipes';
import { TranslatePipe as TranslatePipe_1 } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  standalone: true,
  imports: [TranslatePipe_1],
})
export class AboutComponent {
  constructor(private translatePipe: TranslatePipe) {}
}
