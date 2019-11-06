import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {
  MatAutocompleteSelectedEvent,
  MatSelectChange,
  MatDialog,
} from '@angular/material';
import { FormGroup, FormControl, FormArray, Validators } from '@angular/forms';

import { AddInstitutionWizardComponent } from '../../wizards/add-institution-wizard/add-institution-wizard.component';

import { basePerson, baseInstitution } from '../base-objects';
import { ContentProviderService } from '../../../services/content-provider.service';
import { getMapping, setMapping } from '../../../services/selected-id.service';
import { IMetaDataInstitution } from '../../../interfaces';

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.scss'],
})
export class PersonComponent implements OnInit, OnChanges {
  @Input() public relatedEntityId = '';
  @Input() public person: FormGroup = basePerson(this.relatedEntityId);
  @Input() public preview = false;

  public isExistingPerson = false;

  public availableRoles = [
    { type: 'RIGHTS_OWNER', value: 'Rightsowner', checked: false },
    { type: 'CREATOR', value: 'Creator', checked: false },
    { type: 'EDITOR', value: 'Editor', checked: false },
    { type: 'DATA_CREATOR', value: 'Data Creator', checked: false },
    { type: 'CONTACT_PERSON', value: 'Contact Person', checked: false },
  ];

  private ServerInstitutions = new Array<IMetaDataInstitution>();

  constructor(
    private content: ContentProviderService,
    private dialog: MatDialog,
  ) {
    this.person.controls = {
      ...basePerson(this.relatedEntityId).controls,
      ...this.person.controls,
    };

    this.content.$Institutions.subscribe(
      institutions => (this.ServerInstitutions = institutions),
    );
  }

  public prettyRoleString(role: string) {
    return role
      .split('_')
      .map(word => word.toLowerCase().replace(/^\w/, c => c.toUpperCase()))
      .join(' ');
  }

  // Getters
  get contact_references() {
    return this.person.get('contact_references') as FormGroup;
  }
  get roles() {
    return this.person.get('roles') as FormGroup;
  }
  get current_roles() {
    return this.roles.controls[this.relatedEntityId].value;
  }
  get institutions() {
    return this.person.get('institutions') as FormGroup;
  }
  get relatedInstitutions() {
    return this.institutions.get(this.relatedEntityId) as FormArray;
  }
  get _id() {
    return this.person.get('_id') as FormControl;
  }
  get prename() {
    return this.person.get('prename') as FormControl;
  }
  get name() {
    return this.person.get('name') as FormControl;
  }

  ngOnInit() {
    if (this.relatedEntityId === '' || !this.relatedEntityId) {
      throw new Error('Person without relatedEntityId').stack;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.person && changes.person.currentValue !== undefined) {
      this.person = changes.person.currentValue;

      // Find latest non-empty contact ref
      const refs = this.contact_references.getRawValue();
      let latestRef;
      let latestId;

      for (const id in refs) {
        const isEmpty = refs[id].mail === '';
        if (isEmpty) continue;
        const date = refs[id].creation_date;
        if (!latestRef || date > latestRef.creation_date) {
          latestRef = refs[id];
          latestId = id;
        }
      }

      setMapping(
        this._id.value,
        'contact_references',
        latestId ? latestId : this.relatedEntityId,
      );

      this.isExistingPerson = this.name.value !== '';

      // Update roles
      for (const role of this.availableRoles) {
        role.checked = this.roles
          .getRawValue()
          [this.relatedEntityId].includes(role.type);
      }

      this.reevaluateContactReferences();
      this.roles.updateValueAndValidity();
    }
  }

  public editInstitution = (institution: FormGroup) =>
    this.institutionDialog(institution);

  public institutionSelected = (
    event: MatAutocompleteSelectedEvent,
    input: HTMLInputElement,
  ) => {
    const institution = baseInstitution(
      this.relatedEntityId,
      event.option.value,
    );
    this.institutionDialog(institution);
    input.value = event.option.value.name;
  };

  public institutionDialog = (institution: FormGroup) => {
    this.dialog
      .open(AddInstitutionWizardComponent, {
        data: {
          institution,
          entityID: this.relatedEntityId,
        },
        disableClose: true,
      })
      .afterClosed()
      .toPromise()
      .then(resultInstitution => {
        if (!resultInstitution) return;
        this.relatedInstitutions.push(resultInstitution);
        this.content.updateInstitutions();
      });
  };

  // Dynamic label for mat-tabs
  public getTabLabel = (prop: any, type: string) => {
    return prop && prop.length > 0 ? prop : `New ${type}`;
  };

  public getDateString = (date: number) => new Date(date).toDateString();

  // Expose Object.keys() to NGX-HTML
  public getKeys = (obj: any) => Object.keys(obj);

  public debug = (obj: any) => console.log(obj);

  public addInstitution = () => {
    this.institutionDialog(baseInstitution(this.relatedEntityId));
  };

  public removeInstitution = (index: number) =>
    (this.institutions.controls[this.relatedEntityId] as FormArray).removeAt(
      index,
    );

  public updateRoles = () => {
    (this.roles.controls[this.relatedEntityId] as FormArray).clear();

    this.availableRoles
      .filter(role => role.checked)
      .map(role => new FormControl(role.type))
      .forEach(control =>
        (this.roles.controls[this.relatedEntityId] as FormArray).push(control),
      );

    this.roles.updateValueAndValidity();
  };

  get selected_contact_ref() {
    return (
      getMapping(this._id.value, 'contact_references') || this.relatedEntityId
    );
  }
  get current_contact_ref() {
    return (
      this.contact_references.value[this.selected_contact_ref] || undefined
    );
  }

  get autocompleteInstitutions() {
    const ids = this.relatedInstitutions.value.map(_i => _i._id);
    return this.ServerInstitutions.filter(_i => !ids.includes(_i._id));
  }

  // We only need the selected contact reference to be valid
  private reevaluateContactReferences() {
    console.log(
      this._id.value,
      getMapping(this._id.value, 'contact_references'),
    );
    Object.entries(this.contact_references.controls).forEach(entry => {
      if (entry[0] === this.selected_contact_ref) {
        entry[1].enable();
      } else {
        entry[1].disable();
      }
      entry[1].updateValueAndValidity();
    });

    this.contact_references.updateValueAndValidity();
    this.person.updateValueAndValidity();
  }

  public selectContactRef(event: MatSelectChange) {
    setMapping(this._id.value, 'contact_references', event.value);

    this.reevaluateContactReferences();
  }
}
