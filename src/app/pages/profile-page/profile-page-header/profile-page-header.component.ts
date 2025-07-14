import { Component, Input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { DialogHelperService } from 'src/app/services/dialog-helper.service'; // Import the service
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-page-header',
  templateUrl: './profile-page-header.component.html',
  styleUrls: ['./profile-page-header.component.scss'],
  standalone: true,
  imports: [
    MatIcon,
    MatTooltip,
    TranslatePipe,
    CommonModule
  ],
})
export class ProfilePageHeaderComponent {
  @Input() userData: any;

  constructor(
    private dialogHelper: DialogHelperService // Use DialogHelperService
  ) {}

  openEditDialog(): void {
    this.dialogHelper.editUserProfile(this.userData).afterClosed().subscribe((updatedProfile) => {
      if (updatedProfile) {
        this.userData = updatedProfile; // Profil im Frontend aktualisieren
        
      }
    });
  }
}