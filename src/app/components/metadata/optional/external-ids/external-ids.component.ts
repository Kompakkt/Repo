import { AsyncPipe } from '@angular/common';
import { Component, computed, EventEmitter, inject, input, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { combineLatest, map, startWith } from 'rxjs';
import { AnyEntity, PhysicalEntity, TypeValueTuple } from 'src/app/metadata';
import { TranslatePipe } from 'src/app/pipes';
import { OptionalCardListComponent } from '../optional-card-list/optional-card-list.component';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { CounterService } from 'src/app/services/single-number-counter.service';

@Component({
  selector: 'app-external-ids',
  standalone: true,
  imports: [
    AsyncPipe,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    TranslatePipe,
    OptionalCardListComponent,
    OutlinedInputComponent,
  ],
  templateUrl: './external-ids.component.html',
  styleUrl: './external-ids.component.scss',
})
export class ExternalIdsComponent {
  public propertyType = 'externalId';
  public entity = input.required<AnyEntity>();
  @Output() itemAdded = new EventEmitter<{ item: object; type: string }>();

  public valueControl = new FormControl('', { nonNullable: true });
  public typeControl = new FormControl('', { nonNullable: true });

  isPhysical = computed(() => this.entity() instanceof PhysicalEntity);

  public isExternalIdentifiersValid$ = combineLatest([
    this.valueControl.valueChanges.pipe(startWith(this.valueControl.value)),
    this.typeControl.valueChanges.pipe(startWith(this.typeControl.value)),
  ]).pipe(map(([value, type]) => value !== '' && type !== ''));

  addNewIdentifier() {
    const identifierInstance = new TypeValueTuple({
      value: this.valueControl.value ?? '',
      type: this.typeControl.value ?? '',
    });

    if (identifierInstance.isValid) {
      this.entity().externalId.push(identifierInstance);
      this.resetFormFields();
      this.itemAdded.emit({ item: identifierInstance, type: this.propertyType });
    }
  }

  private resetFormFields() {
    this.valueControl.reset();
    this.typeControl.reset();
  }
}
