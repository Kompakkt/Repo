import { Component } from '@angular/core';
import { TranslatePipe } from 'src/app/pipes';

@Component({
  selector: 'app-profile-page-help',
  templateUrl: './profile-page-help.component.html',
  styleUrls: ['./profile-page-help.component.scss'],
  standalone: true,
  imports: [TranslatePipe],
})
export class ProfilePageHelpComponent {
}
