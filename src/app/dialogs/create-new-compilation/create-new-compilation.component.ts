import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { TranslatePipe } from 'src/app/pipes';
import { AccountService, BackendService } from 'src/app/services';
import { ICompilation } from '@kompakkt/common';

@Component({
  selector: 'app-create-new-compilation',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OutlinedInputComponent,
    TranslatePipe,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './create-new-compilation.component.html',
  styleUrl: './create-new-compilation.component.scss',
})
export class CreateNewCompilationComponent {
  #backend = inject(BackendService);
  #account = inject(AccountService);
  #dialogRef = inject<MatDialogRef<CreateNewCompilationComponent, ICompilation>>(MatDialogRef);

  compilationFormGroup = new FormGroup({
    name: new FormControl('', {
      validators: [Validators.required, Validators.minLength(3)],
      nonNullable: true,
    }),
    description: new FormControl('', {
      validators: [Validators.required, Validators.minLength(3)],
      nonNullable: true,
    }),
  });

  async save() {
    if (!this.compilationFormGroup.valid) {
      console.warn(this.compilationFormGroup.errors, this.compilationFormGroup.controls);
      return;
    }

    const { name, description } = this.compilationFormGroup.getRawValue();

    const strippedUser = await firstValueFrom(this.#account.strippedUser$);
    const currentProfile = await firstValueFrom(this.#account.currentProfile$);

    if (!strippedUser || !currentProfile) {
      console.error('User not authenticated');
      return;
    }

    const result = await this.#backend
      .createEmptyCompilation({ name, description, profileId: currentProfile._id })
      .catch(err => {
        console.error('Failed to create compilation', err);
        return null;
      });

    if (!result) {
      return;
    }

    this.#dialogRef.close(result);
  }
}
