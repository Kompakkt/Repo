import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { startWith } from 'rxjs';
import { AnimatedImageComponent } from 'src/app/components';
import { TranslatePipe } from 'src/app/pipes';
import { BackendService } from 'src/app/services/backend.service';
import { IPublicProfile, ProfileType } from 'src/common';
import { environment } from 'src/environment';

@Component({
  selector: 'app-profile-page-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TranslatePipe,
    AnimatedImageComponent,
  ],
  templateUrl: './profile-page-edit.component.html',
  styleUrl: './profile-page-edit.component.scss',
})
export class ProfilePageEditComponent {
  #fb = inject(FormBuilder);
  data = inject<Partial<IPublicProfile> | undefined>(MAT_DIALOG_DATA);

  isNew = signal(!this.data?._id);
  isInstitution = signal(this.data?.type === ProfileType.institution);

  form = this.#fb.nonNullable.group({
    displayName: [this.data?.displayName ?? '', Validators.required],
    location: [this.data?.location ?? ''],
    imageUrl: [this.data?.imageUrl ?? ''],
    description: [this.data?.description ?? '', Validators.maxLength(500)],
    website: [this.data?.socials?.website ?? ''],
  });

  dialogRef: MatDialogRef<ProfilePageEditComponent, IPublicProfile> = inject(MatDialogRef);
  backend = inject(BackendService);

  formImageUrl = toSignal(
    this.form.controls.imageUrl.valueChanges.pipe(startWith(this.data?.imageUrl)),
  );

  imageUrl = computed(() => {
    const imageUrl = this.formImageUrl();
    if (!imageUrl) return '/assets/noimage.png';
    return imageUrl.startsWith('data:') ? imageUrl : `${environment.server_url}${imageUrl}`;
  });

  async save() {
    if (this.form.valid) {
      const formValue = this.form.value;
      const payload = {
        ...this.data,
        displayName: formValue.displayName,
        location: formValue.location,
        imageUrl: formValue.imageUrl,
        description: formValue.description,
        socials: {
          ...this.data?.socials,
          website: formValue.website,
        },
        type: this.data?.type ?? ProfileType.user,
      };

      const updateProfile = await this.backend.updateProfile(payload);
      this.dialogRef.close(updateProfile);
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        this.form.patchValue({ imageUrl: base64String });
      };
      reader.readAsDataURL(file);
    }
  }
}
