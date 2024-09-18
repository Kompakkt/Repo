import { Component } from '@angular/core';
import { TranslatePipe } from 'src/app/pipes';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  standalone: true,
  imports: [TranslatePipe],
})
export class AboutComponent {
  constructor(private translatePipe: TranslatePipe) {}
}
