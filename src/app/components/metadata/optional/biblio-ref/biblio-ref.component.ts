import { Component, Input } from '@angular/core';
import {
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';

import { MatButton, MatIconButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { AnyEntity, DescriptionValueTuple} from 'src/app/metadata';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { OptionalCardListComponent } from "../optional-card-list/optional-card-list.component";
import { MatDividerModule } from '@angular/material/divider';
import { Subscription } from 'rxjs';
import { MetadataCommunicationService } from 'src/app/services/metadata-communication.service';

@Component({
  selector: 'app-biblio-ref',
  standalone: true,
  imports: [
    CommonModule,
    MatButton,
    MatDividerModule,
    MatFormField,
    MatButton,
    MatIconModule,
    MatIconButton,
    MatInputModule,
    MatLabel,
    ReactiveFormsModule,
    TranslatePipe,
    OptionalCardListComponent
],
  templateUrl: './biblio-ref.component.html',
  styleUrl: './biblio-ref.component.scss'
})
export class BiblioRefComponent {
  @Input() entity!: AnyEntity;

  public referenceControl = new FormControl<string>('');
  public descriptionControl = new FormControl<string>('');

  private biblioSubscription: Subscription;
  public dataIsEditable: boolean = false;
  public isUpdating: boolean = false;

  private dataIndex;

  constructor(private metadataCommunicationService: MetadataCommunicationService) {
    this.biblioSubscription = this.metadataCommunicationService.selectedMetadata$.subscribe(update => {
      if(update) {
        this.isUpdating = true;
        this.dataIndex = update.index;
        this.setDataInForm(update.data);
      }
    })
  }

  get isBiblioDataValid(): boolean {
    return this.descriptionControl.value !== '';
  }

  addNewBiblioData(): void {
    const biblioInstance = new DescriptionValueTuple({
      value: this.referenceControl.value ?? '',
      description: this.descriptionControl.value ?? ''
    });

    if(this.isBiblioDataValid && DescriptionValueTuple.checkIsValid(biblioInstance)) {
      this.entity.biblioRefs.push(biblioInstance);
      this.resetFormFields();
    }
  }

  updateMetadata(): void {
    this.entity.biblioRefs[this.dataIndex].description = this.descriptionControl.value ?? '';
    this.entity.biblioRefs[this.dataIndex].value = this.referenceControl.value ?? '';

    this.resetFormFields();
    this.metadataCommunicationService.selectMetadata(null, null);
  }

  onEditData(inputElementString: string): void {
    let currentFormControl;

    switch (inputElementString) {
      case 'description':
        currentFormControl = this.descriptionControl;
        break;
      case 'reference':
        currentFormControl = this.referenceControl;
        break;
      default:
        break;
    }

    currentFormControl.enable();   
  }

  setDataInForm(biblioData) {
    this.referenceControl.setValue(biblioData?.value);
    this.referenceControl.disable();
    this.descriptionControl.setValue(biblioData?.description);
    this.descriptionControl.disable();

    this.dataIsEditable = true;
  }

  resetFormFields(): void {
    this.referenceControl.setValue('');
    this.descriptionControl.setValue('');

    this.descriptionControl.enable();
    this.referenceControl.enable();

    this.isUpdating = false;
    this.dataIsEditable = false;
    this.metadataCommunicationService.selectMetadata(null, null);
  }
}
