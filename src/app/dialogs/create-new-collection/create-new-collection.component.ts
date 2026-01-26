import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { TranslatePipe } from 'src/app/pipes';
import { ICompilation } from 'src/common';

export type CreateNewCollectionResult = {
  name: string;
  description: string;
} | null;

@Component({
  selector: 'app-create-new-collection',
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
  templateUrl: './create-new-collection.component.html',
  styleUrl: './create-new-collection.component.scss',
})
export class CreateNewCollectionComponent {
  collectionFormGroup = new FormGroup<
    Record<keyof Pick<ICompilation, 'name' | 'description'>, AbstractControl<string>>
  >({
    name: new FormControl('', {
      validators: [Validators.required, Validators.minLength(3)],
      nonNullable: true,
    }),
    description: new FormControl('', {
      validators: [Validators.required, Validators.minLength(3)],
      nonNullable: true,
    }),
  });
}
