import { Component } from '@angular/core';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';

@Component({
  selector: 'app-notfound',
  templateUrl: './notfound.component.html',
  styleUrls: ['./notfound.component.scss'],
  imports: [TranslatePipe],
})
export class NotFoundComponent {}
