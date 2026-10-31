import { Component, model, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AnyEntity, cloneEntity, DescriptionValueTuple, PhysicalEntity } from 'src/app/metadata';
import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { OptionalCardListComponent } from '../optional-card-list/optional-card-list.component';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { form, FormField, required } from '@angular/forms/signals';

const emptyTuple = () => ({ value: '', description: '' });

@Component({
  selector: 'app-links',
  imports: [
    FormField,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    TranslatePipe,
    OptionalCardListComponent,
    OutlinedInputComponent,
  ],
  templateUrl: './links.component.html',
  styleUrl: './links.component.scss',
})
export class LinksComponent {
  entity = model.required<AnyEntity>();
  isPhysical = computed(() => this.entity() instanceof PhysicalEntity);

  tupleModel = model(emptyTuple());
  tupleForm = form(this.tupleModel, path => {
    required(path.description);
    required(path.value);
  });

  addNewLinkData() {
    const { description, value } = this.tupleForm().value();
    this.entity.update(entity => {
      const clone = cloneEntity(entity);
      const externalLinhk = [...clone.externalLink];
      externalLinhk.push(new DescriptionValueTuple({ description, value }));
      return clone;
    });
    this.tupleForm().value.set(emptyTuple());
  }
}
