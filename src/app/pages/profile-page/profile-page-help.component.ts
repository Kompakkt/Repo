import { Component } from '@angular/core';
import { TranslatePipe } from 'src/app/pipes';
import { TranslatePipe as TranslatePipe_1 } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-profile-page-help',
  templateUrl: './profile-page-help.component.html',
  styleUrls: ['./profile-page-help.component.scss'],
  standalone: true,
  imports: [TranslatePipe_1],
})
export class ProfilePageHelpComponent {
  constructor(private translatePipe: TranslatePipe) {}
}
