import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { AnyEntity, DescriptionValueTuple } from 'src/app/metadata';
import { MetadataCommunicationService } from 'src/app/services/metadata-communication.service';
import { DataTuple } from 'src/common';
import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { OptionalCardListComponent } from '../optional-card-list/optional-card-list.component';

@Component({
  selector: 'app-biblio-ref',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
    TranslatePipe,
    OptionalCardListComponent,
  ],
  templateUrl: './biblio-ref.component.html',
  styleUrl: './biblio-ref.component.scss',
})
export class BiblioRefComponent {
  public entity = input.required<AnyEntity>();

  public referenceControl = new FormControl<string>('', { nonNullable: true });
  public descriptionControl = new FormControl<string>('', { nonNullable: true });

  private biblioSubscription: Subscription;
  public dataIsEditable: boolean = false;
  public isUpdating: boolean = false;

  private dataIndex: number = -1;

  constructor(private metadataCommunicationService: MetadataCommunicationService) {
    this.biblioSubscription = this.metadataCommunicationService.selectedMetadata$.subscribe(
      update => {
        if (update) {
          this.dataIndex = update.index;
          this.setDataInForm(update.data);
        }
      },
    );
  }

  get isBiblioDataValid(): boolean {
    return this.descriptionControl.value !== '';
  }

  addNewBiblioData(): void {
    const biblioInstance = new DescriptionValueTuple({
      value: this.referenceControl.value ?? '',
      description: this.descriptionControl.value ?? '',
    });

    if (this.isBiblioDataValid && DescriptionValueTuple.checkIsValid(biblioInstance)) {
      this.entity().biblioRefs.push(biblioInstance);
      this.resetFormFields();
    }
  }

  updateMetadata(): void {
    if (!this.isBiblioDataValid || this.dataIndex < 0) {
      return;
    }
    this.entity().biblioRefs[this.dataIndex].description = this.descriptionControl.value ?? '';
    this.entity().biblioRefs[this.dataIndex].value = this.referenceControl.value ?? '';

    this.resetFormFields();
    this.isUpdating = false;
    this.dataIsEditable = false;
  }

  onEditData(inputElementString: string): void {
    const currentFormControl = {
      description: this.descriptionControl,
      reference: this.referenceControl,
    }[inputElementString];

    currentFormControl?.enable();
  }

  setDataInForm(biblioData: DataTuple) {
    if ('value' in biblioData && 'description' in biblioData) {
      this.referenceControl.setValue(biblioData?.value);
      this.referenceControl.disable();
      this.descriptionControl.setValue(biblioData?.description);
      this.descriptionControl.disable();

      this.dataIsEditable = true;
      this.isUpdating = true;
    }
  }

  resetFormFields(): void {
    this.referenceControl.reset();
    this.descriptionControl.reset();

    this.descriptionControl.enable();
    this.referenceControl.enable();

    this.dataIsEditable = false;
    this.isUpdating = false;
  }
}
