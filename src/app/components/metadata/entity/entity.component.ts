import {
  Component,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  MatAutocompleteSelectedEvent,
  MatDialog,
  MatRadioChange,
} from '@angular/material';
import { FormArray, FormControl, FormGroup } from '@angular/forms';

import { ContentProviderService } from '../../../services/content-provider.service';
import { ObjectIdService } from '../../../services/object-id.service';
import { ConfirmationDialogComponent } from '../../dialogs/confirmation-dialog/confirmation-dialog.component';
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
} from '../base-objects';

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
      description: 'CC Attribution',
      link: 'https://creativecommons.org/licenses/by/4.0',
    },
    {
      title: 'BY-SA',
      description: 'CC Attribution-ShareAlike',
      link: 'https://creativecommons.org/licenses/by-sa/4.0',
    },
    {
      title: 'BY-ND',
      description: 'CC Attribution-NoDerivatives',
      link: 'https://creativecommons.org/licenses/by-nd/4.0',
    },
    {
      title: 'BYNC',
      description: 'CC Attribution-NonCommercial',
      link: 'https://creativecommons.org/licenses/by-nc/4.0',
    },
    {
      title: 'BYNCSA',
      description: 'CC Attribution-NonCommercial-ShareAlike',
      link: 'https://creativecommons.org/licenses/by-nc-sa/4.0',
    },
    {
      title: 'BYNCND',
      description: 'CC Attribution-NonCommercial-NoDerivatives',
      link: 'https://creativecommons.org/licenses/by-nc-nd/4.0',
    },
  ];
  public selectedLicence = '';

  constructor(
    public content: ContentProviderService,
    private objectId: ObjectIdService,
    public dialog: MatDialog,
  ) {}

  public personSelected = (event: MatAutocompleteSelectedEvent) => {
    const person = basePerson(this._id.value, event.option.value);
    this.persons.push(person);
  };

  public institutionSelected = (event: MatAutocompleteSelectedEvent) => {
    const institution = baseInstitution(this._id.value, event.option.value);
    this.institutions.push(institution);
  };

  public tagSelected = (event: MatAutocompleteSelectedEvent) => {
    const tag = baseTag();
    tag.patchValue(event.option.value);
    this.tags.push(tag);
  };

  // Dynamic label for mat-tabs
  public getTabLabel = (prop: any, type: string) => {
    return `New ${type}`;
  };

  public updateLicence = (event: MatRadioChange) =>
    this.licence.setValue(event.value);

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
    this.persons.push(newPerson);
    this.content.addReferencePerson(newPerson);
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

  // Handle institutions
  public addInstitution = () => {
    const newInstitution = baseInstitution(this.entity.controls._id.value);
    newInstitution.controls._id.setValue(this.objectId.generateEntityId());
    this.institutions.push(newInstitution);
    this.content.addReferenceInstitution(newInstitution);
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
      this.discipline.push(
        new FormControl((event.target as HTMLInputElement).value),
      );
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

  ngOnInit() {
    if (this._id.value === '') {
      this._id.setValue(this.objectId.generateEntityId());
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Update entity from parent
    // Used when overwriting
    if (changes.entity) {
      if (changes.entity.currentValue !== undefined) {
        this.entity = changes.entity.currentValue;

        // On digital entities, overwrite the licence
        if (
          this.entity.controls.licence &&
          this.entity.controls.licence.value !== ''
        ) {
          this.selectedLicence = this.entity.controls.licence.value;
        }
      }
    }
  }
}
