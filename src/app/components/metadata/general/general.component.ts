import {
  Component,
  computed,
  output,
  model,
  inject,
  signal,
  effect,
  resource,
  OnInit,
} from '@angular/core';
import {
  MatAutocompleteModule,
  type MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatOption, MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { NgxFluentPipe } from '@apappas1129/ngx-fluent';
import { OutlinedInputComponent } from '../../outlined-input/outlined-input.component';
import { form, FormField, required } from '@angular/forms/signals';
import { isDigitalEntity, isPhysicalEntity, ITag } from '@kompakkt/common';
import { AnyEntity, emptyTag } from 'src/app/metadata';
import { CombinedFormErrorsComponent } from '../../combined-form-errors/combined-form-errors.component';
import { BackendService } from 'src/app/services/backend.service';

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
    NgxFluentPipe,
    OutlinedInputComponent,
    CombinedFormErrorsComponent,
  ],
  templateUrl: './general.component.html',
  styleUrl: './general.component.scss',
})
export class GeneralComponent implements OnInit {
  #backend = inject(BackendService);

  entity = model.required<AnyEntity>();
  isDigitalEntity = computed(() => isDigitalEntity(this.entity()));
  isPhysicalEntity = computed(() => isPhysicalEntity(this.entity()));
  remove = output<{ property: string; index: number }>();

  searchTagModel = model('');
  searchTagForm = form(this.searchTagModel);

  generalModel = model({ title: '', description: '', collection: '' });
  generalForm = form(this.generalModel, path => {
    required(path.title, { message: 'Title is required' });
    required(path.description, { message: 'Description is required' });
  });
  _updateEntityFromFormChangeEffectRef = effect(() => {
    const data = this.generalForm().value();
    this.entity.update(entity => {
      const clone = structuredClone(entity);
      clone.title = data.title;
      clone.description = data.description;
      if ('collection' in clone) {
        clone.collection = data.collection;
      }
      return clone;
    });
  });

  #tagsResource = resource({
    loader: () => this.#backend.getAllTags(),
  });
  availableTags = computed(() => {
    const tags = this.#tagsResource.hasValue() ? this.#tagsResource.value() : [];
    // De-duplicate tags based on value
    const tagMap = new Map<string, ITag>();
    tags.forEach(t => {
      if (!tagMap.has(t.value)) {
        tagMap.set(t.value, { ...emptyTag(), ...t });
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

  #isInSelection = signal(false);

  displayTag = () => '';

  #addTag(value: string) {
    this.entity.update(entity => {
      const clone = structuredClone(entity);
      if ('tags' in clone) {
        const tags = [...clone.tags, { ...emptyTag(), value }];
        clone.tags = tags;
        return clone;
      } else {
        return entity;
      }
    });
    this.searchTagForm().value.set('');
  }

  async selectTag(event: MatAutocompleteSelectedEvent) {
    const tagId = (event.option as MatOption<string>).value;
    const tag = this.availableTags().find(t => t._id === tagId);
    if (!tag) return console.warn(`Could not find tag with id ${tagId}`);
    this.#isInSelection.set(true);
    this.#addTag(tag.value);
    setTimeout(() => {
      this.#isInSelection.set(false);
    });
  }

  public onRemove(property: string, index: number) {
    this.remove.emit({ property, index });
  }

  onChipKeydown() {
    if (this.#isInSelection()) return;
    const value = this.searchTagForm().value().trim();
    if (value.length === 0) return;
    this.#addTag(value);
  }

  ngOnInit() {
    this.generalModel.update(model => {
      const entity = this.entity();
      const collection = 'collection' in entity ? entity.collection : model.collection;
      return { ...model, title: entity.title, description: entity.description, collection };
    });
  }
}
