import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatOption } from '@angular/material/core';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { TranslatePipe } from 'src/app/pipes';
import { AgentsComponent } from '../agents/agents.component';
import { BiblioRefComponent } from '../optional/biblio-ref/biblio-ref.component';
import { LinksComponent } from '../optional/links/links.component';
import { AnyEntity, DigitalEntity, PhysicalEntity, Tag } from 'src/app/metadata';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { isDigitalEntity } from 'src/common';
import { filter, map, Observable, startWith, tap, withLatestFrom } from 'rxjs';
import { MatChipGrid, MatChipInput, MatChipInputEvent, MatChipRemove, MatChipRow } from '@angular/material/chips';
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import { ContentProviderService } from 'src/app/services';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

@Component({
  selector: 'app-general',
  standalone: true,
  imports: [
        CommonModule,
        MatAutocomplete,
        MatAutocompleteTrigger,
        MatChipGrid,
        MatChipInput,
        MatChipRow,
        MatChipRemove,
        MatFormField,
        MatIcon,
        MatInput,
        MatLabel,
        MatOption,
        MatHint,
        TranslatePipe,
        ReactiveFormsModule,
        FormsModule
  ],
  templateUrl: './general.component.html',
  styleUrl: './general.component.scss'
})
export class GeneralComponent implements OnChanges {

  @Input('entity')
  public entity!: PhysicalEntity | DigitalEntity;
  @Input() public physicalEntity!: PhysicalEntity;
  @Input() public digitalEntity!: DigitalEntity;

  @Input() physicalEntityStream!: Observable<PhysicalEntity>;
  @Input() digitalEntityStream!: Observable<DigitalEntity>;

  @Output() remove = new EventEmitter<any>();

  @ViewChild('tagInput') tagInput!: ElementRef<HTMLInputElement>;

  public entitySubject = new BehaviorSubject<AnyEntity | undefined>(undefined);

  public searchTag = new FormControl('');
  public separatorKeysCodes: number[] = [ENTER, COMMA];

  public availableTags = new BehaviorSubject<Tag[]>([]);

  public filteredTags$: Observable<Tag[]>;

  private isInSelection: boolean = false;

  constructor(public content: ContentProviderService,) {
    this.content.$Tags.subscribe(tags => {
      this.availableTags.next(tags.map(t => new Tag(t)));
    });


    this.filteredTags$ = this.searchTag.valueChanges.pipe(
      startWith(''),
      map(value => (value as string).toLowerCase()),
      withLatestFrom(this.digitalEntity$),
      map(([value, digitalEntity]) =>
        this.availableTags.value
          .filter(t => !digitalEntity.tags.find(tt => tt.value === t.value))
          .filter(t => t.value.toLowerCase().includes(value)),
      ),
    );

  }

  get digitalEntity$() {
    return this.entitySubject.pipe(
      filter(entity => isDigitalEntity(entity)),
      map(entity => entity as DigitalEntity),
    );
  }

    public addTag(event: MatChipInputEvent, digitalEntity: DigitalEntity) {
      const tagText = event.value;
      if(tagText !== '' && !this.isInSelection) {
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
      // this.searchTag.patchValue('');
      // this.searchTag.setValue('');
      this.tagInput.nativeElement.value = '';

      setTimeout(() => this.isInSelection = false);
    }

  ngOnChanges(changes: SimpleChanges): void {
    if(this.physicalEntity) {
      this.entity = this.physicalEntity;
    }

    const digitalEntity = changes.digitalEntity?.currentValue as DigitalEntity | undefined;

    const physicalEntity = changes.physicalEntity?.currentValue as PhysicalEntity | undefined;

    console.log(digitalEntity, physicalEntity);

    if (digitalEntity) this.entitySubject.next(digitalEntity);

    if (physicalEntity) this.entitySubject.next(physicalEntity);

    if (!digitalEntity && !physicalEntity) this.entitySubject.next(new DigitalEntity());
  }

  public onRemove(property: string, index: number) {
    this.remove.emit({ property, index});
  }

}

