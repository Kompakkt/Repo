import { Component, Input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Clipboard } from '@angular/cdk/clipboard';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { DialogHelperService } from 'src/app/services/dialog-helper.service'; // Import the service

@Component({
  selector: 'app-profile-page-header',
  templateUrl: './profile-page-header.component.html',
  styleUrls: ['./profile-page-header.component.scss'],
  standalone: true,
  imports: [
    MatIcon,
    MatTooltip,
    TranslatePipe,
  ],
})
export class ProfilePageHeaderComponent {
  @Input() userData: any;

  constructor(
    private clipboard: Clipboard,
    private dialogHelper: DialogHelperService // Use DialogHelperService
  ) {}

  get roleTooltip(): string {
    switch (this.userData?.role) {
      case 'user':
        return 'You are a registered user with basic access';
      case 'uploadrequested':
        return 'You have requested upload permissions';
      case 'uploader':
        return 'You have uploading rights';
      case 'admin':
        return 'You have administrative rights';
      default:
        return 'Role information not available';
    }
  }

  openEditDialog(): void {
    this.dialogHelper.editUserProfile(this.userData); // Use the helper method
  }

  copyEmailToClipboard(): void {
    if (this.userData?.mail) {
      this.clipboard.copy(this.userData.mail);
      console.log('Email copied to clipboard:', this.userData.mail);
    }
  }
}