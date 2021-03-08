import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { MatRadioChange } from '@angular/material/radio';
import { AbstractControl, FormArray, FormControl, FormGroup } from '@angular/forms';

import { AddPersonWizardComponent } from '../../../wizards/add-person-wizard/add-person-wizard.component';
import { AddInstitutionWizardComponent } from '../../../wizards/add-institution-wizard/add-institution-wizard.component';

import { ContentProviderService } from '../../../services/content-provider.service';
import { ObjectIdService } from '../../../services/object-id.service';
import { ConfirmationDialogComponent } from '../../../dialogs/confirmation-dialog/confirmation-dialog.component';
import {
  baseCreation,
  baseDigital,
  baseDimension,
  baseEntity,
  baseExternalId,
  baseExternalLink,
  baseInstitution,
  basePerson,
  basePhysical,
  baseTag,
  baseOther,
  baseBiblioRef,
  baseFile,
} from '../base-objects';
import { IMetaDataPerson, IMetaDataInstitution } from '@kompakkt/shared';

@Component({
  selector: 'app-entity',
  templateUrl: './entity.component.html',
  styleUrls: ['./entity.component.scss'],
})
export class EntityComponent implements OnInit, OnChanges {
  // Determine whether this entity is digital or physical
  @Input() isPhysical = false;

  // Instance of this entity
  @Input() entity: FormGroup = (() => {
    const base = baseEntity();
    base.controls = {
      ...base.controls,
      ...(this.isPhysical ? basePhysical() : baseDigital()).controls,
    };
    return base;
  })();

  public availableLicences = [
    {
      title: 'BY',
      description: 'Attribution 4.0 International (CC BY 4.0)',
      link: 'https://creativecommons.org/licenses/by/4.0',
    },
    {
      title: 'BY-SA',
      description: 'Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)',
      link: 'https://creativecommons.org/licenses/by-sa/4.0',
    },
    {
      title: 'BY-ND',
      description: 'Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0)',
      link: 'https://creativecommons.org/licenses/by-nd/4.0',
    },
    {
      title: 'BYNC',
      description: 'Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)',
      link: 'https://creativecommons.org/licenses/by-nc/4.0',
    },
    {
      title: 'BYNCSA',
      description: 'Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)',
      link: 'https://creativecommons.org/licenses/by-nc-sa/4.0',
    },
    {
      title: 'BYNCND',
      description: 'Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)',
      link: 'https://creativecommons.org/licenses/by-nc-nd/4.0',
    },
  ];
  public selectedLicence = '';

  private ServerPersons = new Array<IMetaDataPerson>();
  private ServerInstitutions = new Array<IMetaDataInstitution>();

  public personSearchInput = '';
  public institutionSearchInput = '';
  public tagsSearchInput = '';

  constructor(
    public content: ContentProviderService,
    private objectId: ObjectIdService,
    public dialog: MatDialog,
  ) {
    this.content.$Persons.subscribe(persons => (this.ServerPersons = persons));
    this.content.$Institutions.subscribe(institutions => (this.ServerInstitutions = institutions));
  }

  public personSelected = (event: MatAutocompleteSelectedEvent, input: HTMLInputElement) => {
    const person = basePerson(this.entity.controls._id.value, event.option.value);
    this.personDialog(person);
    input.value = '';
  };

  public institutionSelected = (event: MatAutocompleteSelectedEvent, input: HTMLInputElement) => {
    const institution = baseInstitution(this.entity.controls._id.value, event.option.value);
    this.institutionDialog(institution);
    input.value = '';
  };

  public editPerson = (person: FormGroup) => this.personDialog(person);

  public editInstitution = (institution: FormGroup) => this.institutionDialog(institution);

  public tagSelected = (event: MatAutocompleteSelectedEvent) => {
    const tag = baseTag();
    tag.patchValue(event.option.value);
    this.tags.push(tag);
  };

  public changeTagSearch = (event: Event) => {
    this.tagsSearchInput =
      (event.target as HTMLInputElement).value.toLowerCase() ?? this.tagsSearchInput;
  };

  public changePersonSearch = (event: Event) => {
    this.personSearchInput =
      (event.target as HTMLInputElement).value.toLowerCase() ?? this.personSearchInput;
  };

  public changeInstSearch = (event: Event) => {
    this.institutionSearchInput =
      (event.target as HTMLInputElement).value.toLowerCase() ?? this.institutionSearchInput;
  };

  public getControlAsFormgroup = (obj: AbstractControl) => obj as FormGroup;

  // Dynamic label for mat-tabs
  public getTabLabel = (prop: any, type: string) => {
    return prop && prop.length > 0 ? prop : `New ${type}`;
  };

  public updateLicence = (event: MatRadioChange) => this.licence.setValue(event.value);

  public getPersonName = (person: any | IMetaDataPerson) => {
    return person.name.value
      ? `${person.prename.value} ${person.name.value}`
      : `${person.prename} ${person.name}`;
  };

  // Handle externalId
  public addExternalId = () => this.externalId.push(baseExternalId());

  public removeExternalId = (index: number) => {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: 'Are you sure you want to delete this external identifier?',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.externalId.removeAt(index);
      }
    });
  };

  // Handle externalLink
  public addExternalLink = () => this.externalLink.push(baseExternalLink());

  public removeExternalLink = (index: number) => {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: 'Are you sure you want to delete this creation?',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.externalLink.removeAt(index);
      }
    });
  };

  // Handle BiblioRefs
  public addBiblioRef = () => this.biblioRefs.push(baseBiblioRef());

  public removeBiblioRef = (index: number) => {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: 'Are you sure you want to delete this bibliographic reference?',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.biblioRefs.removeAt(index);
      }
    });
  };

  public addOther = () => this.other.push(baseOther());

  public removeOther = (index: number) => {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: 'Are you sure you want to delete this information?',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.other.removeAt(index);
      }
    });
  };

  // Handle persons
  public addPerson = () => {
    const newPerson = basePerson(this.entity.controls._id.value);
    newPerson.controls._id.setValue(this.objectId.generateEntityId());
    this.personDialog(newPerson);
  };

  public removePerson = (index: number) => {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: 'Are you sure you want to delete this person?',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.persons.removeAt(index);
      }
    });
  };

  public personDialog = (person: FormGroup) => {
    this.dialog
      .open(AddPersonWizardComponent, {
        data: {
          person,
          entityID: this.entity.value._id,
        },
        disableClose: true,
      })
      .afterClosed()
      .toPromise()
      .then(resultPerson => {
        if (!resultPerson) return;
        if (!this.persons.value.find((_p: IMetaDataPerson) => _p._id === resultPerson.value._id)) {
          this.persons.push(resultPerson);
        }
        this.content.updatePersons();
      });
  };

  // Handle institutions
  public addInstitution = () => {
    const newInstitution = baseInstitution(this.entity.controls._id.value);
    newInstitution.controls._id.setValue(this.objectId.generateEntityId());
    this.institutionDialog(newInstitution);
  };

  public removeInstitution = (index: number) => {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: 'Are you sure you want to delete this institution?',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.institutions.removeAt(index);
      }
    });
  };

  public institutionDialog = (institution: FormGroup) => {
    this.dialog
      .open(AddInstitutionWizardComponent, {
        data: {
          institution,
          entityID: this.entity.value._id,
        },
        disableClose: true,
      })
      .afterClosed()
      .toPromise()
      .then((resultInstitution: FormGroup) => {
        if (!resultInstitution) return;

        const index = this.institutions.value.findIndex(
          (inst: IMetaDataInstitution) => inst._id === resultInstitution.value._id,
        );
        if (index >= 0) {
          this.institutions.setControl(index, resultInstitution);
        } else {
          this.institutions.push(resultInstitution);
        }

        this.content.updateInstitutions();
      });
  };

  // Handle physical entities
  public addPhysicalEntity = () => {
    const base = baseEntity();
    base.controls = {
      ...base.controls,
      ...basePhysical().controls,
    };
    base.controls._id.setValue(this.objectId.generateEntityId());
    this.phyObjs.push(base);
  };

  public removePhysicalEntity = (index: number) => {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: 'Are you sure you want to delete this physical entity?',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.phyObjs.removeAt(index);
      }
    });
  };

  // Handle discipline input
  public addDiscipline = (event: KeyboardEvent) => {
    if (event.keyCode === 13 || event.key === 'Enter') {
      event.preventDefault();
      this.discipline.push(new FormControl((event.target as HTMLInputElement).value));
      (event.target as HTMLInputElement).value = '';
    }
  };

  public removeDiscipline = (index: number) => {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: 'Are you sure you want to delete this discipline?',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.discipline.removeAt(index);
      }
    });
  };

  // Handle tag input
  public addTag = (event: KeyboardEvent) => {
    if (event.keyCode === 13 || event.key === 'Enter') {
      event.preventDefault();
      const newTag = baseTag();
      newTag.setValue({
        _id: this.objectId.generateEntityId(),
        value: (event.target as HTMLInputElement).value,
      });
      this.tags.push(newTag);
      (event.target as HTMLInputElement).value = '';

      this.tagsSearchInput = '';
    }
  };

  public removeTag = (index: number) => this.tags.removeAt(index);

  // Handle dimensions
  public addDimension = () => this.dimensions.push(baseDimension());

  public removeDimension = (index: number) => {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: 'Are you sure you want to delete this dimension entry?',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dimensions.removeAt(index);
      }
    });
  };

  // Handle creation
  public addCreation = () => this.creation.push(baseCreation());

  public removeCreation = (index: number) => {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: 'Are you sure you want to delete this creation entry?',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.creation.removeAt(index);
      }
    });
  };

  // Getters
  // FormArrays
  get persons() {
    return this.entity.get('persons') as FormArray;
  }
  get institutions() {
    return this.entity.get('institutions') as FormArray;
  }
  get externalId() {
    return this.entity.get('externalId') as FormArray;
  }
  get externalLink() {
    return this.entity.get('externalLink') as FormArray;
  }
  get biblioRefs() {
    return this.entity.get('biblioRefs') as FormArray;
  }
  get other() {
    return this.entity.get('other') as FormArray;
  }
  get metadata_files() {
    return this.entity.get('metadata_files') as FormArray;
  }
  get discipline() {
    return this.entity.get('discipline') as FormArray;
  }
  get tags() {
    return this.entity.get('tags') as FormArray;
  }

  get autocompleteTags() {
    return this.content
      .getTags()
      .filter(_u =>
        this.tagsSearchInput === '' ? true : _u.value.toLowerCase().includes(this.tagsSearchInput),
      );
  }

  get dimensions() {
    return this.entity.get('dimensions') as FormArray;
  }
  get creation() {
    return this.entity.get('creation') as FormArray;
  }
  get files() {
    return this.entity.get('files') as FormArray;
  }
  get phyObjs() {
    return this.entity.get('phyObjs') as FormArray;
  }
  // FormGroups
  get place() {
    return this.entity.get('place') as FormGroup;
  }
  get placeAddress() {
    return this.place.get('address') as FormGroup;
  }
  // FormControls
  get licence() {
    return this.entity.get('licence') as FormControl;
  }
  get description() {
    return this.entity.get('description') as FormControl;
  }
  get objecttype() {
    return this.entity.get('objecttype') as FormControl;
  }
  get statement() {
    return this.entity.get('statement') as FormControl;
  }
  get title() {
    return this.entity.get('title') as FormControl;
  }
  get type() {
    return this.entity.get('type') as FormControl;
  }
  get _id() {
    return this.entity.get('_id') as FormControl;
  }
  // Nested Groups for ngFor
  get personsFG() {
    return this.persons.controls as FormGroup[];
  }
  get institutionsFG() {
    return this.institutions.controls as FormGroup[];
  }
  get dimensionsFG() {
    return this.dimensions.controls as FormGroup[];
  }
  get creationsFG() {
    return this.creation.controls as FormGroup[];
  }
  get externalIdsFG() {
    return this.externalId.controls as FormGroup[];
  }
  get externalLinksFG() {
    return this.externalLink.controls as FormGroup[];
  }
  get biblioRefsFG() {
    return this.biblioRefs.controls as FormGroup[];
  }
  get othersFG() {
    return this.other.controls as FormGroup[];
  }
  get phyObjsFG() {
    return this.phyObjs.controls as FormGroup[];
  }

  public async handleFileInput(fileInput: HTMLInputElement) {
    if (!fileInput.files) {
      alert('Failed getting files');
      return;
    }
    const files: File[] = [];
    for (let i = 0; i < fileInput.files.length; i++) {
      files.push(fileInput.files[i]);
    }

    const readfile = async (_fileToRead: File) => {
      return new Promise<FormGroup | undefined>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsText(_fileToRead);

        reader.onloadend = _ => {
          const fileContent = reader.result as string | null;
          if (!fileContent) {
            console.error('Failed reading file content');
            resolve(undefined);
            return;
          }

          const base = baseFile();
          base.patchValue({
            file_name: _fileToRead.name,
            file_link: fileContent,
            file_size: _fileToRead.size,
            file_format: _fileToRead.name.includes('.')
              ? _fileToRead.name.slice(_fileToRead.name.indexOf('.'))
              : _fileToRead.name,
          });

          console.log('Item content length:', fileContent.length);
          console.log('File as FormGroup:', base);
          resolve(base);
        };
      });
    };

    for (const file of files) {
      const fileAsFormGroup = await readfile(file);
      if (!fileAsFormGroup) continue;
      this.metadata_files.controls.push(fileAsFormGroup);
    }
  }

  get autocompletePersons() {
    const ids = this.persons.value.map((_p: IMetaDataPerson) => _p._id);
    return this.ServerPersons.filter(_p => {
      if (ids.includes(_p._id)) return false;
      return this.personSearchInput === ''
        ? true
        : this.getPersonName(_p).toLowerCase().includes(this.personSearchInput);
    });
  }

  get autocompleteInstitutions() {
    const ids = this.institutions.value.map((_i: IMetaDataInstitution) => _i._id);
    return this.ServerInstitutions.filter(_i => {
      if (ids.includes(_i._id)) return false;
      return this.institutionSearchInput === ''
        ? true
        : _i.name.toLowerCase().includes(this.institutionSearchInput);
    });
  }

  ngOnInit() {
    if (this.entity.controls._id.value === '') {
      this.entity.controls._id.setValue(this.objectId.generateEntityId());
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Update entity from parent
    // Used when overwriting
    if (changes.entity) {
      if (changes.entity.currentValue !== undefined) {
        this.entity = changes.entity.currentValue;

        // On digital entities, overwrite the licence
        if (this.entity.controls.licence && this.entity.controls.licence.value !== '') {
          this.selectedLicence = this.entity.controls.licence.value;
        }
      }
    }
  }
}
