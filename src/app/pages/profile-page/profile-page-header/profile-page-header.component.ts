import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IUserData } from 'src/common';
import { IPublicProfile, IUserDataWithoutData } from 'src/common/interfaces';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { environment } from 'src/environment';
import { AnimatedImageComponent } from 'src/app/components';

@Component({
  selector: 'app-profile-page-header',
  templateUrl: './profile-page-header.component.html',
  styleUrls: ['./profile-page-header.component.scss'],
  standalone: true,
  imports: [MatIconModule, MatTooltipModule, TranslatePipe, CommonModule, AnimatedImageComponent],
})
export class ProfilePageHeaderComponent {
  userData = input.required<IUserDataWithoutData | IUserData>();
  profileData = input<IPublicProfile | undefined>();
  editProfile = output<void>();

  availableName = computed(() => {
    return this.profileData()?.displayName ?? this.userData().fullname;
  });
  imageUrl = computed(() => {
    const imageUrl = this.profileData()?.imageUrl;
    if (!imageUrl) return '/assets/noimage.png';
    return imageUrl.startsWith('data:') ? imageUrl : `${environment.server_url}${imageUrl}`;
  });
}
