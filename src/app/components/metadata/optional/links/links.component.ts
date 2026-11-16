import { Component, model, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgxFluentPipe } from '@apappas1129/ngx-fluent';
import { OptionalCardListComponent } from '../optional-card-list/optional-card-list.component';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { form, FormField, required } from '@angular/forms/signals';
import { AnyEntity, emptyDescriptionValueTuple } from 'src/app/metadata';
import { isPhysicalEntity } from '@kompakkt/common';

@Component({
  selector: 'app-links',
  imports: [
    FormField,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    NgxFluentPipe,
    OptionalCardListComponent,
    OutlinedInputComponent,
  ],
  templateUrl: './links.component.html',
  styleUrl: './links.component.scss',
})
export class LinksComponent {
  entity = model.required<AnyEntity>();
  isPhysical = computed(() => isPhysicalEntity(this.entity()));

  tupleModel = model(emptyDescriptionValueTuple());
  tupleForm = form(this.tupleModel, path => {
    required(path.description);
    required(path.value);
  });

  addNewLinkData() {
    const { description, value } = this.tupleForm().value();
    this.entity.update(entity => {
      const clone = structuredClone(entity);
      clone.externalLink = [
        ...clone.externalLink,
        { ...emptyDescriptionValueTuple(), value, description },
      ];
      return clone;
    });
    this.tupleForm().value.set(emptyDescriptionValueTuple());
  }
}
