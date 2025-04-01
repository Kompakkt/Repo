import { Component, Input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-profile-page-header',
  templateUrl: './profile-page-header.component.html',
  styleUrls: ['./profile-page-header.component.scss'],
  standalone: true,
  imports: [
    MatIcon,
    MatTooltip
  ],
})
export class ProfilePageHeaderComponent {
  @Input() userData: any;

  get roleTooltip(): string {
    if (this.userData?.role === 'uploader') {
      return 'You have uploading rights';
    }
    return 'You have basic viewing rights';
  }
}

