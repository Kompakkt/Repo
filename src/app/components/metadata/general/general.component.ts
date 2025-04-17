import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  ElementRef,
  EventEmitter,
  input,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatAutocompleteModule,
  type MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { type MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { filter, map, Observable, startWith, withLatestFrom } from 'rxjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { AnyEntity, DigitalEntity, PhysicalEntity, Tag } from 'src/app/metadata';
import { TranslatePipe } from 'src/app/pipes';
import { ContentProviderService } from 'src/app/services';
import { MetadataCommunicationService } from 'src/app/services/metadata-communication.service';
import { isDigitalEntity, isPhysicalEntity } from 'src/common';

@Component({
  selector: 'app-general',
  standalone: true,
  imports: [
    CommonModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatOptionModule,
    TranslatePipe,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './general.component.html',
  styleUrl: './general.component.scss',
})
export class GeneralComponent {
  entity = input.required<PhysicalEntity | DigitalEntity>();
  digitalEntity = computed(() => {
    const entity = this.entity();
    return isDigitalEntity(entity) ? entity : undefined;
  });
  digitalEntity$ = toObservable(this.digitalEntity);
  physicalEntity = computed(() => {
    const entity = this.entity();
    return isPhysicalEntity(entity) ? entity : undefined;
  });
  physicalEntity$ = toObservable(this.physicalEntity);

  @Output() remove = new EventEmitter<any>();

  @ViewChild('tagInput') tagInput!: ElementRef<HTMLInputElement>;

  public searchTag = new FormControl('');
  public separatorKeysCodes: number[] = [ENTER, COMMA];

  public availableTags = new BehaviorSubject<Tag[]>([]);

  public filteredTags$: Observable<Tag[]>;

  private isInSelection: boolean = false;

  constructor(
    public content: ContentProviderService,
    private metaService: MetadataCommunicationService,
  ) {
    this.content.$Tags.subscribe(tags => {
      this.availableTags.next(tags.map(t => new Tag(t)));
    });

    this.filteredTags$ = this.searchTag.valueChanges.pipe(
      startWith(''),
      map(value => (value as string).toLowerCase()),
      withLatestFrom(this.digitalEntity$),
      map(([value, digitalEntity]) =>
        this.availableTags.value
          .filter(t => !digitalEntity?.tags.find(tt => tt.value === t.value))
          .filter(t => t.value.toLowerCase().includes(value)),
      ),
    );
  }

  public addTag(event: MatChipInputEvent, digitalEntity: DigitalEntity) {
    const tagText = event.value;
    if (tagText !== '' && !this.isInSelection) {
      const tag = new Tag();
      tag.value = tagText;
      digitalEntity.addTag(tag);
      // this.searchTag.patchValue('');
      // this.searchTag.setValue('');
      event.chipInput.inputElement.value = '';
    }
  }

  public addDiscipline(event: MatChipInputEvent, digitalEntity: DigitalEntity) {
    const discipline = event.value;
    digitalEntity.discipline.push(discipline);
    event.chipInput.inputElement.value = '';
  }

  public async selectTag(event: MatAutocompleteSelectedEvent, digitalEntity: DigitalEntity) {
    const tagId = event.option.value;
    const tag = this.availableTags.value.find(t => t._id === tagId);
    if (!tag) return console.warn(`Could not tag with id ${tagId}`);
    this.isInSelection = true;
    digitalEntity.addTag(tag);
    this.tagInput.nativeElement.value = '';

    setTimeout(() => (this.isInSelection = false));
  }

  public onChangeInputValues() {
    if (this.entity instanceof PhysicalEntity) {
      this.metaService.updatePhysicalEntity(this.entity);
    }
  }

  public onRemove(property: string, index: number) {
    this.remove.emit({ property, index });
  }
}
