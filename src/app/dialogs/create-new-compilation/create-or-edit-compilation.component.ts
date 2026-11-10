import { AfterViewInit, Component, inject, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { NgxFluentPipe } from '@apappas1129/ngx-fluent';
import { ICompilation } from '@kompakkt/common';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { BackendService } from 'src/app/services/backend.service';
import { AccountService } from 'src/app/services/account.service';

@Component({
  selector: 'app-create-or-edit-compilation',
  imports: [
    FormField,
    OutlinedInputComponent,
    NgxFluentPipe,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './create-or-edit-compilation.component.html',
  styleUrl: './create-or-edit-compilation.component.scss',
})
export class CreateOrEditCompilationComponent implements AfterViewInit {
  #backend = inject(BackendService);
  #account = inject(AccountService);
  #dialogRef = inject<MatDialogRef<CreateOrEditCompilationComponent, ICompilation>>(MatDialogRef);

  existing = inject<ICompilation | undefined>(MAT_DIALOG_DATA);

  compilationModel = model({ name: '', description: '' });
  compilationForm = form(this.compilationModel, path => {
    required(path.name);
    minLength(path.name, 3);
    required(path.description);
    minLength(path.description, 3);
  });

  async save() {
    if (this.compilationForm().invalid()) {
      console.warn(this.compilationForm().errorSummary());
      return;
    }

    const { name, description } = this.compilationForm().value();

    const strippedUser = this.#account.strippedUser();
    const currentProfile = this.#account.currentProfile();

    if (!strippedUser || !currentProfile) {
      console.error('User not authenticated');
      return;
    }

    const result = await (async () => {
      const existing = this.existing;
      if (existing) {
        return this.#backend
          .updateCompilationMetadata({
            _id: existing._id,
            name,
            description,
            profileId: currentProfile._id,
          })
          .catch(err => {
            console.error('Failed to update compilation', err);
            return null;
          });
      } else {
        return this.#backend
          .createEmptyCompilation({ name, description, profileId: currentProfile._id })
          .catch(err => {
            console.error('Failed to create compilation', err);
            return null;
          });
      }
    })();

    if (!result) {
      return;
    }

    this.#dialogRef.close(result);
  }

  ngAfterViewInit(): void {
    const existing = this.existing;
    if (existing) {
      this.compilationForm().value.set({
        name: existing.name,
        description: existing.description,
      });
    }
  }
}
