import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { form, Field, ValidationError } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { createDigitalEntity, createPerson, createTag, digitalEntitySchema } from '../index';
import { TranslatePipe } from 'src/app/pipes';
import { IDigitalEntity, IPhysicalEntity, ITag } from 'src/common';
import { MatTab, MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { ContentProviderService } from 'src/app/services';
import { combineLatest, firstValueFrom, map } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { AsyncPipe, KeyValuePipe } from '@angular/common';
import { Licences } from 'src/app/metadata/licences';
import { SignalAgentsComponent } from '../signal-agents/signal-agents.component';
import { SignalOptionalMetadataComponent } from '../signal-optional-metadata/signal-optional-metadata.component';
import { SignalMetadataFilesComponent } from '../signal-metadata-files/signal-metadata-files.component';

@Component({
  selector: 'app-signal-entity',
  imports: [
    Field,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatSidenavModule,
    MatTooltipModule,
    MatListModule,
    MatRadioModule,
    MatChipsModule,
    TranslatePipe,
    KeyValuePipe,
    AsyncPipe,
    SignalAgentsComponent,
    SignalOptionalMetadataComponent,
    SignalMetadataFilesComponent,
  ],
  templateUrl: './signal-entity.component.html',
  styleUrl: './signal-entity.component.scss',
})
export class SignalEntityComponent {
  entity = signal(createDigitalEntity());
  entityForm = form(this.entity, digitalEntitySchema);
  entityChanged = output<{
    value: IDigitalEntity<Record<string, unknown>, true>;
    errors: ValidationError.WithField[];
  }>();

  #content = inject(ContentProviderService);
  tags$ = this.#content.$Tags.pipe(
    map(tags => {
      const tagMap = new Map<string, string>();
      for (const tag of tags) {
        tagMap.set(tag.value, tag._id);
      }
      return Array.from(tagMap.entries()).map(([value, _id]) => ({ value, _id }) as ITag);
    }),
  );
  searchTagText = signal('');
  filteredTags$ = combineLatest([toObservable(this.searchTagText), this.tags$]).pipe(
    map(([searchText, tags]) => {
      const cleaned = searchText.trim().toLowerCase();
      if (cleaned.length < 2) return [];
      return tags.filter(t => t.value.toLowerCase().includes(cleaned));
    }),
  );
  separatorKeysCodes = [ENTER, COMMA] as const;

  availableLicences = Licences;

  constructor() {
    effect(() => {
      const value = this.entityForm().value();
      const errors = this.entityForm().errorSummary();
      this.entityChanged.emit({ value, errors });
    });
  }

  tabGroup = viewChild(MatTabGroup);
  selectTab(tab: MatTab) {
    const group = this.tabGroup();
    if (!group) return;
    for (let i = 0; i < group._tabs.length; i++) {
      const other = group._tabs.get(i);
      if (other === tab) {
        group.selectedIndex = i;
        return;
      }
    }
  }

  async addTag(event: MatChipInputEvent) {
    const value = event.value.trim();
    const tags = await firstValueFrom(this.tags$);

    const existing = tags.find(t => t.value.toLowerCase() === value.toLowerCase());
    if (existing) {
      this.entityForm.tags().value.update(state => [...state, existing]);
    } else {
      const newTag = createTag();
      newTag.value = value;
      this.entityForm.tags().value.update(state => [...state, newTag]);
    }
    this.searchTagText.set('');
    event.chipInput!.clear();
  }
  async selectTag(event: MatAutocompleteSelectedEvent) {
    const tagId = event.option.value;
    const tags = await firstValueFrom(this.tags$);
    const tag = tags.find(t => t._id === tagId);
    if (tag) {
      this.entityForm.tags().value.update(state => [...state, tag]);
    }
    this.searchTagText.set('');
    event.option.deselect();
  }
  removeTag(index: number) {
    this.entityForm.tags().value.update(state => {
      const newTags = [...state];
      console.log(newTags);
      newTags.splice(index, 1);
      return newTags;
    });
  }
  addDiscipline(event: MatChipInputEvent) {
    const value = event.value.trim();
    if (value.length === 0) return;
    this.entityForm.discipline().value.update(state => [...state, value]);
    event.chipInput!.clear();
  }
  removeDiscipline(index: number) {
    this.entityForm.discipline().value.update(state => {
      const newDisciplines = [...state];
      newDisciplines.splice(index, 1);
      return newDisciplines;
    });
  }
}
