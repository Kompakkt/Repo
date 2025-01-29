import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, input, computed } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import {
  MatChipGrid,
  MatChipInput,
  MatChipInputEvent,
  MatChipRemove,
  MatChipRow,
} from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, startWith, withLatestFrom } from 'rxjs/operators';

import { AsyncPipe } from '@angular/common';
import { MatIconButton } from '@angular/material/button';
import { MatOption } from '@angular/material/core';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelContent,
  MatExpansionPanelDescription,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MatTooltip } from '@angular/material/tooltip';
import {
  CreationTuple,
  DescriptionValueTuple,
  DigitalEntity,
  DimensionTuple,
  FileTuple,
  Institution,
  Person,
  PhysicalEntity,
  PlaceTuple,
  Tag,
  TypeValueTuple,
} from 'src/app/metadata';
import { ContentProviderService } from 'src/app/services';
import { isDigitalEntity, isPhysicalEntity } from 'src/common';
import { FilesizePipe } from '../../../pipes/filesize.pipe';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { AddressComponent } from '../address/address.component';
import { InstitutionComponent } from '../institution/institution.component';
import { PersonComponent } from '../person/person.component';

type AnyEntity = DigitalEntity | PhysicalEntity;

@Component({
  selector: 'app-entity',
  templateUrl: './entity.component.html',
  styleUrls: ['./entity.component.scss'],
  imports: [
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatIcon,
    MatTooltip,
    MatExpansionPanelDescription,
    MatExpansionPanelContent,
    MatFormField,
    MatLabel,
    MatInput,
    FormsModule,
    MatChipGrid,
    MatChipRow,
    MatChipRemove,
    MatAutocompleteTrigger,
    MatChipInput,
    ReactiveFormsModule,
    MatAutocomplete,
    MatOption,
    MatHint,
    MatRadioGroup,
    MatRadioButton,
    AddressComponent,
    MatIconButton,
    PersonComponent,
    InstitutionComponent,
    AsyncPipe,
    FilesizePipe,
    TranslatePipe,
  ],
})
export class EntityComponent {
  digitalEntity = input<DigitalEntity>();
  physicalEntity = input<PhysicalEntity>();
  entity = computed(() => {
    return this.digitalEntity() ?? this.physicalEntity() ?? new DigitalEntity();
  });

  public availableLicences = [
    {
      title: 'CC0',
      src: 'assets/licence/CC0.png',
      description: 'No Rights Reserved (CC0)',
      link: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    {
      title: 'PDM',
      src: 'assets/licence/PDM.png',
      description: 'Public Domain Mark 1.0 Universal (PDM 1.0)',
      link: 'https://creativecommons.org/publicdomain/mark/1.0/',
    },
    {
      title: 'BY',
      src: 'assets/licence/BY.png',
      description: 'Attribution 4.0 International (CC BY 4.0)',
      link: 'https://creativecommons.org/licenses/by/4.0',
    },
    {
      title: 'BY-SA',
      src: 'assets/licence/BY-SA.png',
      description: 'Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)',
      link: 'https://creativecommons.org/licenses/by-sa/4.0',
    },
    {
      title: 'BY-ND',
      src: 'assets/licence/BY-ND.png',
      description: 'Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0)',
      link: 'https://creativecommons.org/licenses/by-nd/4.0',
    },
    {
      title: 'BYNC',
      src: 'assets/licence/BYNC.png',
      description: 'Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)',
      link: 'https://creativecommons.org/licenses/by-nc/4.0',
    },
    {
      title: 'BYNCSA',
      src: 'assets/licence/BYNCSA.png',
      description: 'Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)',
      link: 'https://creativecommons.org/licenses/by-nc-sa/4.0',
    },
    {
      title: 'BYNCND',
      src: 'assets/licence/BYNCND.png',
      description: 'Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)',
      link: 'https://creativecommons.org/licenses/by-nc-nd/4.0',
    },
    {
      title: 'AR',
      src: 'assets/licence/AR.png',
      description: 'All rights reserved',
      link: 'https://en.wikipedia.org/wiki/All_rights_reserved',
    },
  ];

  // Public for validation
  public PhysicalEntity = PhysicalEntity;
  public DimensionTuple = DimensionTuple;
  public PlaceTuple = PlaceTuple;
  public CreationTuple = CreationTuple;
  public TypeValueTuple = TypeValueTuple;
  public DescriptionValueTuple = DescriptionValueTuple;
  public Person = Person;
  public Institution = Institution;
  public Tag = Tag;
  public FileTuple = FileTuple;

  // Autocomplete Inputs
  public availablePersons = new BehaviorSubject<Person[]>([]);
  public availableInstitutions = new BehaviorSubject<Institution[]>([]);
  public availableTags = new BehaviorSubject<Tag[]>([]);
  public searchPerson = new FormControl('');
  public searchInstitution = new FormControl('');
  public searchTag = new FormControl('');
  public filteredPersons$: Observable<Person[]>;
  public filteredInstitutions$: Observable<Institution[]>;
  public filteredTags$: Observable<Tag[]>;
  public separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor(
    public content: ContentProviderService,
    public dialog: MatDialog,
  ) {
    (window as any)['printEntity'] = () => console.log(this.entity());

    this.content.$Persons.subscribe(persons => {
      this.availablePersons.next(persons.map(p => new Person(p)));
    });

    this.content.$Institutions.subscribe(insts => {
      this.availableInstitutions.next(insts.map(i => new Institution(i)));
    });

    this.content.$Tags.subscribe(tags => {
      this.availableTags.next(tags.map(t => new Tag(t)));
    });

    this.filteredPersons$ = this.searchPerson.valueChanges.pipe(
      startWith(''),
      map(value => (value as string).toLowerCase()),
      map(value =>
        this.availablePersons.value.filter(p => p.fullName.toLowerCase().includes(value)),
      ),
    );
    this.filteredInstitutions$ = this.searchInstitution.valueChanges.pipe(
      startWith(''),
      map(value => (value as string).toLowerCase()),
      map(value =>
        this.availableInstitutions.value.filter(i => i.name.toLowerCase().includes(value)),
      ),
    );
    this.filteredTags$ = this.searchTag.valueChanges.pipe(
      startWith(''),
      map(value => (value as string).toLowerCase()),
      withLatestFrom(toObservable(this.digitalEntity)),
      map(([value, digitalEntity]) =>
        this.availableTags.value
          .filter(t => !digitalEntity?.tags.find(tt => tt.value === t.value))
          .filter(t => t.value.toLowerCase().includes(value)),
      ),
    );
  }

  // Autocomplete methods
  public selectPerson(event: MatAutocompleteSelectedEvent) {
    const personId = event.option.value;
    const person = this.availablePersons.value.find(p => p._id === personId);
    if (!person) return console.warn(`Could not find person with id ${personId}`);
    this.entity().addPerson(person);
  }

  public async selectInstitution(event: MatAutocompleteSelectedEvent, entityId: string) {
    const institutionId = event.option.value;
    const institution = this.availableInstitutions.value.find(i => i._id === institutionId);
    if (!institution) return console.warn(`Could not find institution with id ${institutionId}`);
    this.entity().addInstitution(institution);
  }

  public async selectTag(event: MatAutocompleteSelectedEvent, digitalEntity: DigitalEntity) {
    const tagId = event.option.value;
    const tag = this.availableTags.value.find(t => t._id === tagId);
    if (!tag) return console.warn(`Could not tag with id ${tagId}`);
    digitalEntity.addTag(tag);
  }

  public displayInstitutionName(institution: Institution): string {
    return institution.name;
  }

  public displayPersonName(person: Person): string {
    return person.fullName;
  }
  // /Autocomplete methods

  public async handleFileInput(fileInput: HTMLInputElement) {
    if (!fileInput.files) return alert('Failed getting files');
    const files: File[] = Array.from(fileInput.files);

    const readfile = (_fileToRead: File) =>
      new Promise<FileTuple | undefined>((resolve, _) => {
        const reader = new FileReader();
        reader.readAsText(_fileToRead);

        reader.onloadend = () => {
          const fileContent = reader.result as string | null;
          if (!fileContent) {
            console.error('Failed reading file content');
            return resolve(undefined);
          }

          const file_name = _fileToRead.name;
          const file_link = fileContent;
          const file_size = _fileToRead.size;
          const file_format = _fileToRead.name.includes('.')
            ? _fileToRead.name.slice(_fileToRead.name.indexOf('.'))
            : _fileToRead.name;

          const file = new FileTuple({
            file_name,
            file_link,
            file_size,
            file_format,
          });

          //console.log('Item content length:', fileContent.length);
          //console.log('File:', file);
          resolve(file);
        };
      });

    for (const file of files) {
      const metadataFile = await readfile(file);
      if (!metadataFile) continue;
      this.entity().metadata_files.push(metadataFile);
    }
  }

  // Validation
  get generalInformationValid() {
    const entity = this.entity();
    return entity.title && entity.description;
  }

  get licenceValid() {
    const digitalEntity = this.digitalEntity();
    return digitalEntity?.licence ?? false;
  }

  get placeValid() {
    const physicalEntity = this.physicalEntity();
    return physicalEntity ? PlaceTuple.checkIsValid(physicalEntity.place) : false;
  }

  get hasRightsOwner() {
    const digitalEntity = this.digitalEntity();
    return digitalEntity ? DigitalEntity.hasRightsOwner(digitalEntity) : false;
  }

  get hasContactPerson() {
    const digitalEntity = this.digitalEntity();
    return digitalEntity ? DigitalEntity.hasContactPerson(digitalEntity) : false;
  }

  get personsValid() {
    const entity = this.entity();
    return undefined === entity.persons.find(p => !Person.checkIsValid(p, entity._id.toString()));
  }

  get institutionsValid() {
    const entity = this.entity();
    return (
      undefined ===
      entity.institutions.find(i => !Institution.checkIsValid(i, entity._id.toString()))
    );
  }

  get dimensionsValid() {
    const entity = this.digitalEntity();
    return entity
      ? undefined === entity.dimensions.find(d => !DimensionTuple.checkIsValid(d))
      : false;
  }

  get creationValid() {
    const entity = this.digitalEntity();
    return entity ? undefined === entity.creation.find(c => !CreationTuple.checkIsValid(c)) : false;
  }

  get externalIdValid() {
    const entity = this.entity();
    return undefined === entity.externalId.find(c => !TypeValueTuple.checkIsValid(c));
  }

  get externalLinkValid() {
    const entity = this.entity();
    return undefined === entity.externalLink.find(c => !DescriptionValueTuple.checkIsValid(c));
  }

  get biblioRefsValid() {
    const entity = this.entity();
    return undefined === entity.biblioRefs.find(c => !DescriptionValueTuple.checkIsValid(c, false));
  }

  get otherValid() {
    const entity = this.entity();
    return undefined === entity.other.find(c => !DescriptionValueTuple.checkIsValid(c));
  }

  get metadataFilesValid() {
    const entity = this.entity();
    return undefined === entity.metadata_files.find(c => !FileTuple.checkIsValid(c));
  }

  get phyObjsValid() {
    const entity = this.digitalEntity();
    return entity ? undefined === entity.phyObjs.find(p => !PhysicalEntity.checkIsValid(p)) : false;
  }
  // /Validation

  public addDiscipline(event: MatChipInputEvent, digitalEntity: DigitalEntity) {
    const discipline = event.value;
    digitalEntity.discipline.push(discipline);
    event.input.value = '';
  }

  public addTag(event: MatChipInputEvent, digitalEntity: DigitalEntity) {
    const tagText = event.value;
    const tag = new Tag();
    tag.value = tagText;
    digitalEntity.addTag(tag);
    this.searchTag.patchValue('');
    this.searchTag.setValue('');
    event.input.value = '';
  }

  public addSimpleProperty(event: MouseEvent, entity: AnyEntity, property: string) {
    event.preventDefault();
    event.stopPropagation();
    if (isDigitalEntity(entity)) {
      switch (property) {
        case 'dimensions':
          return entity.dimensions.push(new DimensionTuple());
        case 'creation':
          return entity.creation.push(new CreationTuple());
        case 'tags':
          return entity.tags.push(new Tag());
        case 'phyObjs':
          return entity.phyObjs.push(new PhysicalEntity());
      }
    }
    switch (property) {
      case 'persons':
        return entity.persons.push(this.content.addLocalPerson(new Person()));
      case 'institutions':
        return entity.institutions.push(this.content.addLocalInstitution(new Institution()));
      case 'externalId':
        return entity.externalId.push(new TypeValueTuple());
      case 'externalLink':
        return entity.externalLink.push(new DescriptionValueTuple());
      case 'biblioRefs':
        return entity.biblioRefs.push(new DescriptionValueTuple());
      case 'other':
        return entity.other.push(new DescriptionValueTuple());
      case 'metadata_files':
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.hidden = true;
        document.body.appendChild(input);
        input.onchange = () => this.handleFileInput(input).then(() => input.remove());
        input.click();
        return;
    }
  }

  public removeProperty(entity: AnyEntity, property: string, index: number) {
    if (Array.isArray(entity[property])) {
      const removed = entity[property].splice(index, 1)[0];
      if (!removed) {
        return console.warn('No item removed');
      }
      // No reason to remove locally created persons and institutions
      /*if (isPerson(removed) || isInstitution(removed)) {
        if (property === 'persons' && removed) {
          this.content.removeLocalPerson(removed as Person);
        } else if (property === 'institutions' && removed) {
          this.content.removeLocalInstitution(removed as Institution);
        }
      }*/
    } else {
      console.warn(`Could not remove ${property} at ${index} from ${entity}`);
    }
  }
}
