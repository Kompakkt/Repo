import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AnimatedImageComponent } from 'src/app/components';
import { getServerUrl } from 'src/app/util/get-server-url';
import { IUserData } from 'src/common';
import { IPublicProfile, IUserDataWithoutData } from 'src/common/interfaces';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-profile-page-header',
  templateUrl: './profile-page-header.component.html',
  styleUrls: ['./profile-page-header.component.scss'],
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    TranslatePipe,
    CommonModule,
    AnimatedImageComponent,
  ],
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
    if (!imageUrl) return '/assets/kompakkt-logo-cube.svg';
    return imageUrl.startsWith('data:') ? imageUrl : getServerUrl(`${imageUrl}?t=${Date.now()}`);
  });
}
