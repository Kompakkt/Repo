import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { BackendService } from 'src/app/services/backend.service';

@Component({
  selector: 'app-profile-page-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,   
    MatInputModule,       
    MatButtonModule      
  ],
  templateUrl: './profile-page-edit.component.html',
  styleUrl: './profile-page-edit.component.scss'
})
export class ProfilePageEditComponent {
  form: FormGroup;
  previewImage?: string;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProfilePageEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private backend: BackendService
  ) {
    this.form = this.fb.group({
      displayName: [data.displayName, Validators.required],
      location: [data.location],
      imageUrl: [data.imageUrl],
      description: [data.description, Validators.maxLength(500)],
      website: [data.socials?.website]
    });
  }

  async save(): Promise<void> {
  if (this.form.valid) {
    const formValue = this.form.value;
    const payload = {
      ...this.data,
      displayName: formValue.displayName,
      location: formValue.location,
      imageUrl: formValue.imageUrl,
      description: formValue.description,
      socials: {
        ...this.data.socials,
        website: formValue.website
      },
      type: 'user'
    };
    
    const updateProfile = await this.backend.updateUserProfile(payload);
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
        this.previewImage = base64String;
        this.form.patchValue({ imageUrl: base64String });
      };
      reader.readAsDataURL(file);
    }
  }
}