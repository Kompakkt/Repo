import { Component } from '@angular/core';
import { TranslatePipe } from 'src/app/pipes';

@Component({
    selector: 'app-notfound',
    templateUrl: './notfound.component.html',
    styleUrls: ['./notfound.component.scss'],
    imports: [TranslatePipe]
})
export class NotFoundComponent {
  constructor(private translatePipe: TranslatePipe) {}
}
