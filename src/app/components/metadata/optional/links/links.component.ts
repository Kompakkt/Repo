import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { combineLatest, map, startWith } from 'rxjs';
import { AnyEntity, DescriptionValueTuple } from 'src/app/metadata';
import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { OptionalCardListComponent } from '../optional-card-list/optional-card-list.component';

@Component({
  selector: 'app-links',
  standalone: true,
  imports: [
    AsyncPipe,
    CommonModule,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    TranslatePipe,
    OptionalCardListComponent,
  ],
  templateUrl: './links.component.html',
  styleUrl: './links.component.scss',
})
export class LinksComponent {
  public entity = input.required<AnyEntity>();

  public valueControl = new FormControl('', { nonNullable: true });
  public descriptionControl = new FormControl('', { nonNullable: true });

  public isLinkDataValid$ = combineLatest([
    this.valueControl.valueChanges.pipe(startWith(this.valueControl.value)),
    this.descriptionControl.valueChanges.pipe(startWith(this.descriptionControl.value)),
  ]).pipe(map(([value, description]) => value !== '' && description !== ''));

  addNewLinkData() {
    const linkInstance = new DescriptionValueTuple({
      value: this.valueControl.value ?? '',
      description: this.descriptionControl.value ?? '',
    });

    if (linkInstance.isValid) {
      this.entity().externalLink.push(linkInstance);
      this.resetFormFields();
    }
  }

  resetFormFields() {
    this.valueControl.reset();
    this.descriptionControl.reset();
  }
}
