import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  isProfileType,
  isPublicProfile,
  type CreatorField,
  type IPublicProfile,
  type ProfileReference,
} from '@kompakkt/common';
import { AnimatedImageDirective } from 'src/app/directives/animated-image.directive';
import { TranslatePipe } from 'src/app/pipes';
import { BackendService } from 'src/app/services';
import { getServerUrl } from 'src/app/util/get-server-url';

@Component({
  selector: 'app-uploaded-by',
  templateUrl: './uploaded-by.component.html',
  styleUrls: ['./uploaded-by.component.scss'],
  imports: [RouterLink, TranslatePipe, AnimatedImageDirective],
})
export class UploadedByComponent {
  #backend = inject(BackendService);
  #requestedProfileId: string | undefined = undefined;

  creator = input<CreatorField | undefined>();

  profile = signal<IPublicProfile | undefined>(undefined);

  #profileReference = computed<ProfileReference | undefined>(() => {
    const profile: unknown = this.creator()?.profile;
    if (!profile || typeof profile !== 'object') return undefined;
    const { profileId, type } = profile as Partial<ProfileReference>;
    if (typeof profileId !== 'string' || !profileId) return undefined;
    if (!isProfileType(type)) return undefined;
    return { profileId, type };
  });

  name = computed(
    () => this.profile()?.displayName || this.creator()?.fullname || this.creator()?.username || '',
  );

  description = computed(() => this.profile()?.description ?? '');

  imageUrl = computed(() => {
    const imageUrl = this.profile()?.imageUrl;
    if (!imageUrl) return '/assets/kompakkt-logo-cube.svg';
    return imageUrl.startsWith('data:') ? imageUrl : getServerUrl(imageUrl);
  });

  constructor() {
    effect(() => {
      const reference = this.#profileReference();
      if (!reference) {
        this.#requestedProfileId = undefined;
        this.profile.set(undefined);
        return;
      }
      if (reference.profileId === this.#requestedProfileId) return;
      this.#requestedProfileId = reference.profileId;
      this.profile.set(undefined);
      this.#backend
        .getProfileById(reference.profileId)
        .then(profile => {
          if (this.#requestedProfileId !== reference.profileId) return;
          this.profile.set(isPublicProfile(profile) ? profile : undefined);
        })
        .catch(() => {
          if (this.#requestedProfileId !== reference.profileId) return;
          this.profile.set(undefined);
        });
    });
  }
}
