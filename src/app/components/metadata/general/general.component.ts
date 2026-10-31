import { Component, computed, output, model, inject, signal, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  MatAutocompleteModule,
  type MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatOption, MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { cloneEntity, DigitalEntity, PhysicalEntity, Tag } from 'src/app/metadata';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { ContentProviderService } from 'src/app/services';
import { OutlinedInputComponent } from '../../outlined-input/outlined-input.component';
import { form, FormField, required } from '@angular/forms/signals';
import { isDigitalEntity, isPhysicalEntity } from '@kompakkt/common';

@Component({
  selector: 'app-general',
  imports: [
    FormField,
    MatAutocompleteModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatOptionModule,
    TranslatePipe,
    OutlinedInputComponent,
  ],
  templateUrl: './general.component.html',
  styleUrl: './general.component.scss',
})
export class GeneralComponent {
  public content = inject(ContentProviderService);

  entity = model.required<PhysicalEntity | DigitalEntity>();
  digitalEntity = computed(() => {
    const entity = this.entity();
    return isDigitalEntity(entity) ? (entity as DigitalEntity) : undefined;
  });
  physicalEntity = computed(() => {
    const entity = this.entity();
    return isPhysicalEntity(entity) ? (entity as PhysicalEntity) : undefined;
  });
  remove = output<any>();

  searchTagModel = model('');
  searchTagForm = form(this.searchTagModel);

  entityFieldsModel = model({ title: '', description: '', collection: '' });
  entityFieldsForm = form(this.entityFieldsModel, path => {
    required(path.title);
    required(path.description);
  });
  _updateEntityFromFormChangeEffectRef = effect(() => {
    const data = this.entityFieldsForm().value();
    this.entity.update(entity => {
      const clone = cloneEntity(entity);
      clone.title = data.title;
      clone.description = data.description;
      if ('collection' in clone) {
        clone.collection = data.collection;
      }
      return clone;
    });
  });

  #contentTags = toSignal(this.content.$Tags, { initialValue: [] });
  availableTags = computed(() => {
    const tags = this.#contentTags();
    // De-duplicate tags based on value
    const tagMap = new Map<string, Tag>();
    tags.forEach(t => {
      if (!tagMap.has(t.value)) {
        tagMap.set(t.value, new Tag(t));
      }
    });
    return Array.from(tagMap.values()).sort((a, b) => a.value.localeCompare(b.value));
  });
  filteredTags = computed(() => {
    const query = this.searchTagForm().value().trim().toLowerCase();
    const tags = this.availableTags();
    const entity = this.entity();
    return 'tags' in entity
      ? tags
          .filter(t => !entity?.tags.find(tt => 'value' in tt && tt.value === t.value))
          .filter(t => t.value.toLowerCase().includes(query))
      : [];
  });

  private isInSelection = signal(false);

  public displayTag = () => '';

  #addTag(value: string) {
    this.entity.update(entity => {
      const clone = cloneEntity(entity);
      if ('tags' in clone) {
        const tags = [...clone.tags, new Tag({ value })];
        clone.tags = tags;
        return clone;
      } else {
        return entity;
      }
    });
    this.searchTagForm().value.set('');
  }

  public async selectTag(event: MatAutocompleteSelectedEvent) {
    const tagId = (event.option as MatOption<string>).value;
    const tag = this.availableTags().find(t => t._id === tagId);
    if (!tag) return console.warn(`Could not find tag with id ${tagId}`);
    this.isInSelection.set(true);
    this.#addTag(tag.value);
    setTimeout(() => {
      this.isInSelection.set(false);
    });
  }

  public onRemove(property: string, index: number) {
    this.remove.emit({ property, index });
  }

  onChipKeydown() {
    if (this.isInSelection()) return;
    const value = this.searchTagForm().value().trim();
    if (value.length === 0) return;
    this.#addTag(value);
  }
}
