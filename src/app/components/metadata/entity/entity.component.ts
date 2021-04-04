import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatRadioChange } from '@angular/material/radio';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, filter, startWith, withLatestFrom } from 'rxjs/operators';

import { ContentProviderService } from '../../../services/content-provider.service';
import { ConfirmationDialogComponent } from '../../../dialogs/confirmation-dialog/confirmation-dialog.component';

import {
  DigitalEntity,
  PhysicalEntity,
  DimensionTuple,
  PlaceTuple,
  CreationTuple,
  TypeValueTuple,
  DescriptionValueTuple,
  Person,
  Institution,
  Tag,
  FileTuple,
} from '~metadata';
import {
  IPerson,
  IInstitution,
  IDigitalEntity,
  IPhysicalEntity,
  isDigitalEntity,
  isPhysicalEntity,
  isPerson,
  isInstitution,
  IFile,
} from '~common/interfaces';

type AnyEntity = DigitalEntity | PhysicalEntity;

@Component({
  selector: 'app-entity',
  templateUrl: './entity.component.html',
  styleUrls: ['./entity.component.scss'],
})
export class EntityComponent implements OnChanges {
  @Input('digitalEntity')
  public digitalEntity: DigitalEntity | undefined = undefined;

  @Input('physicalEntity')
  public physicalEntity: PhysicalEntity | undefined = undefined;

  private entitySubject = new BehaviorSubject<AnyEntity | undefined>(undefined);

  public availableLicences = [
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

  constructor(public content: ContentProviderService, public dialog: MatDialog) {
    (window as any)['printEntity'] = () => console.log(this.entitySubject.value);

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
      withLatestFrom(this.digitalEntity$),
      map(([value, digitalEntity]) =>
        this.availableTags.value
          .filter(t => !digitalEntity.tags.find(tt => tt.value === t.value))
          .filter(t => t.value.toLowerCase().includes(value)),
      ),
    );
  }

  // Autocomplete methods
  public selectPerson(event: MatAutocompleteSelectedEvent) {
    const personId = event.option.value;
    const person = this.availablePersons.value.find(p => p._id === personId);
    if (!person) return console.warn(`Could not find person with id ${personId}`);
    this.entitySubject.value?.addPerson(person);
  }

  public async selectInstitution(event: MatAutocompleteSelectedEvent, entityId: string) {
    const institutionId = event.option.value;
    const institution = this.availableInstitutions.value.find(i => i._id === institutionId);
    if (!institution) return console.warn(`Could not find institution with id ${institutionId}`);
    this.entitySubject.value?.addInstitution(institution);
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
      this.entitySubject.value?.metadata_files.push(metadataFile);
    }
  }

  // Entity access
  get entity$() {
    return this.entitySubject.pipe(
      filter(entity => !!entity),
      map(entity => entity as AnyEntity),
    );
  }

  get _id$() {
    return this.entity$.pipe(map(entity => entity._id.toString()));
  }

  get digitalEntity$() {
    return this.entitySubject.pipe(
      filter(entity => isDigitalEntity(entity)),
      map(entity => entity as DigitalEntity),
    );
  }

  get physicalEntity$() {
    return this.entitySubject.pipe(
      filter(entity => isPhysicalEntity(entity)),
      map(entity => entity as PhysicalEntity),
    );
  }
  // /Entity access

  // Validation
  get generalInformationValid$() {
    return this.entity$.pipe(map(entity => entity.title && entity.description));
  }

  get licenceValid$() {
    return this.digitalEntity$.pipe(map(digitalEntity => digitalEntity.licence));
  }

  get placeValid$() {
    return this.physicalEntity$.pipe(
      map(physicalEntity => PlaceTuple.checkIsValid(physicalEntity.place)),
    );
  }

  get hasRightsOwner$() {
    return this.digitalEntity$.pipe(
      map(digitalEntity => DigitalEntity.hasRightsOwner(digitalEntity)),
    );
  }

  get hasContactPerson$() {
    return this.digitalEntity$.pipe(
      map(digitalEntity => DigitalEntity.hasContactPerson(digitalEntity)),
    );
  }

  get personsValid$() {
    return this.entity$.pipe(
      map(
        entity =>
          undefined === entity.persons.find(p => !Person.checkIsValid(p, entity._id.toString())),
      ),
    );
  }

  get institutionsValid$() {
    return this.entity$.pipe(
      map(
        entity =>
          undefined ===
          entity.institutions.find(i => !Institution.checkIsValid(i, entity._id.toString())),
      ),
    );
  }

  get dimensionsValid$() {
    return this.digitalEntity$.pipe(
      map(entity => undefined === entity.dimensions.find(d => !DimensionTuple.checkIsValid(d))),
    );
  }

  get creationValid$() {
    return this.digitalEntity$.pipe(
      map(entity => undefined === entity.creation.find(c => !CreationTuple.checkIsValid(c))),
    );
  }

  get externalIdValid$() {
    return this.entity$.pipe(
      map(entity => undefined === entity.externalId.find(c => !TypeValueTuple.checkIsValid(c))),
    );
  }

  get externalLinkValid$() {
    return this.entity$.pipe(
      map(
        entity =>
          undefined === entity.externalLink.find(c => !DescriptionValueTuple.checkIsValid(c)),
      ),
    );
  }

  get biblioRefsValid$() {
    return this.entity$.pipe(
      map(
        entity =>
          undefined === entity.biblioRefs.find(c => !DescriptionValueTuple.checkIsValid(c, false)),
      ),
    );
  }

  get otherValid$() {
    return this.entity$.pipe(
      map(entity => undefined === entity.other.find(c => !DescriptionValueTuple.checkIsValid(c))),
    );
  }

  get metadataFilesValid$() {
    return this.entity$.pipe(
      map(entity => undefined === entity.metadata_files.find(c => !FileTuple.checkIsValid(c))),
    );
  }

  get phyObjsValid$() {
    return this.digitalEntity$.pipe(
      map(entity => undefined === entity.phyObjs.find(p => !PhysicalEntity.checkIsValid(p))),
    );
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

  ngOnChanges(changes: SimpleChanges) {
    const digitalEntity = changes.digitalEntity?.currentValue as DigitalEntity | undefined;

    const physicalEntity = changes.physicalEntity?.currentValue as PhysicalEntity | undefined;

    console.log(digitalEntity, physicalEntity);

    if (digitalEntity) this.entitySubject.next(digitalEntity);

    if (physicalEntity) this.entitySubject.next(physicalEntity);

    if (!digitalEntity && !physicalEntity) this.entitySubject.next(new DigitalEntity());
  }
}
