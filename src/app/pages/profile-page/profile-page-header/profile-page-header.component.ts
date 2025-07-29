import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslatePipe } from '../../../pipes/translate.pipe';
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
  @Output() editProfile = new EventEmitter<void>();
  onEditClick(): void {
    this.editProfile.emit();
  }

  // get imageSrc(): string {
  //   const img = this.userData?.imageUrl;
  //   if (!img) {
  //     return '/assets/kompakkt-logo.png';
  //   }
  //   if (img.startsWith('data:')) {
  //     return img;
  //   }
  //   return 'https://kompakkt.de/server/' + img;
  // }
  imageSrc: string = '/assets/kompakkt-logo.png'; // default image
  baseUrl = 'https://kompakkt.de/server/';

  ngOnChanges(changes: SimpleChanges) {
    if (!changes['userData']) return;

    const img = this.userData?.imageUrl;
    if (!img) {
      this.imageSrc = '/assets/kompakkt-logo.png';
    } else if (img.startsWith('data:')) {
      this.imageSrc = img;
    } else {
      this.imageSrc = this.baseUrl + img + '?t=' + Date.now();
    }
  }

}