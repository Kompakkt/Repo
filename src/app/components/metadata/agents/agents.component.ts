import { Component, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { TranslatePipe } from '../../../pipes/translate.pipe';
import { Address, AnyEntity, ContactReference, Institution, Person } from 'src/app/metadata';

import { BehaviorSubject, map } from 'rxjs';
import { ContentProviderService, SnackbarService } from 'src/app/services';
import { EntityComponent } from '../entity/entity.component';

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButton,
    MatCheckbox,
    MatDividerModule,
    MatInput,
    MatFormField,
    MatLabel,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: './agents.component.html',
  styleUrl: './agents.component.scss',
})
export class AgentsComponent {
  // @Input() agent!: Person | Institution;
  @Input() agent!: any;
  @Input() entityId!: string;
  @Input() entity!: AnyEntity;

  public prenameControl = new FormControl('');
  public nameControl = new FormControl('');
  public mailControl = new FormControl('');
  public phoneNumberControl = new FormControl('');

  public countryControl = new FormControl('');
  public postalControl = new FormControl('');
  public cityControl = new FormControl('');
  public streetControl = new FormControl('');
  public numberControl = new FormControl('');
  public buildingControl = new FormControl('');

  public personSelected: boolean = false;
  public institutionSelected: boolean = false;

  private anyRoleSelected = new BehaviorSubject(false);
  private availableAddresses = new BehaviorSubject<Address[]>([]);
  private availableContacts = new BehaviorSubject<ContactReference[]>([]);
  private isExisting = new BehaviorSubject(false);
  private selectedContact = new BehaviorSubject<ContactReference | undefined>(undefined);
  private selectedAddress = new BehaviorSubject<Address | undefined>(undefined);
  private currentAgent;

  public availableRoles = [
    { type: 'RIGHTS_OWNER', value: 'Rightsowner', checked: false },
    { type: 'CREATOR', value: 'Creator', checked: false },
    { type: 'EDITOR', value: 'Editor', checked: false },
    { type: 'DATA_CREATOR', value: 'Data Creator', checked: false },
    { type: 'CONTACT_PERSON', value: 'Contact Person', checked: false },
  ];

  constructor(
    public content: ContentProviderService,
    private snackbar: SnackbarService,
  ) {}

  get selectionIsValid(): boolean {
    return this.personSelected || this.institutionSelected;
  }

  get isFormValid(): boolean {
    if (this.personSelected) {
      return this.prenameControl.valid && this.nameControl.valid && this.mailControl.valid;
    } else if (this.institutionSelected) {
      return (
        this.nameControl.valid &&
        this.postalControl.valid &&
        this.cityControl.valid &&
        this.streetControl.valid
      );
    } else return false;
  }

  get atLeastOneRoleSelected(): boolean {
    return this.availableRoles.some(role => role.checked);
  }

  public addNewAgentToEntity() {
    if (this.personSelected) {
      const personInstance = new Person({
        prename: this.prenameControl.value ?? '',
        name: this.nameControl.value ?? '',
      });

      const contactRef = new ContactReference({
        mail: this.mailControl.value ?? '',
        phonenumber: this.phoneNumberControl.value ?? '',
      });

      const roles = this.availableRoles.filter(role => role.checked).map(role => role.type);

      personInstance.contact_references[this.entityId] = contactRef;
      personInstance.roles[this.entityId] = roles;

      this.entity.addPerson(personInstance);
      console.log(personInstance);
    } else if (this.institutionSelected) {
      const institutionInstance = new Institution({
        name: this.nameControl.value ?? '',
      });

      const contactRef = new Address({
        street: this.streetControl.value ?? '',
        number: this.numberControl.value ?? '',
        postcode: this.postalControl.value ?? '',
        city: this.cityControl.value ?? '',
        country: this.countryControl.value ?? '',
        building: this.buildingControl.value ?? '',
      });

      const roles = this.availableRoles.filter(role => role.checked).map(role => role.type);

      institutionInstance.addresses[this.entityId] = contactRef;
      institutionInstance.roles[this.entityId] = roles;

      this.entity.addInstitution(institutionInstance);
    }
    this.resetFormFields();
    this.resetRoleOptions();
  }

  public updateRoles() {
    this.anyRoleSelected.next(!!this.availableRoles.find(role => role.checked));
    this.agent.setRoles(
      this.availableRoles.filter(role => role.checked).map(role => role.type),
      this.entityId,
    );
  }

  public updateFormFields(agent, agentType) {
    if (agentType === 'person') {
      this.prenameControl.setValue(agent.prename || '');
      this.nameControl.setValue(agent.name || '');
      this.mailControl.setValue(agent.contact_references?.[this.entityId]?.mail || '');
      this.personSelected = true;
      this.institutionSelected = false;
    } else {
      this.nameControl.setValue(agent.name || '');
      this.streetControl.setValue(agent.addresses?.[this.entityId]?.street || '');
      this.numberControl.setValue(agent.addresses?.[this.entityId]?.number || '');
      this.cityControl.setValue(agent.addresses?.[this.entityId]?.city || '');
      this.postalControl.setValue(agent.addresses?.[this.entityId]?.postcode || '');
      this.buildingControl.setValue(agent.addresses?.[this.entityId]?.building || '');
      this.institutionSelected = true;
      this.personSelected = false;
    }
  }

  changeAgent(changedOption: string) {
    if (changedOption === 'person') {
      this.institutionSelected = !this.personSelected;
    } else if (changedOption === 'institution') {
      this.personSelected = !this.institutionSelected;
    }
    this.setFormFields();
  }

  setFormFields() {
    if (this.personSelected) {
      this.streetControl.disable();
      this.numberControl.disable();
      this.cityControl.disable();
      this.postalControl.disable();
      this.buildingControl.disable();
      this.countryControl.disable();

      this.prenameControl.enable();
      this.mailControl.enable();
      this.phoneNumberControl.enable();
    }

    if (this.institutionSelected) {
      this.prenameControl.disable();
      this.mailControl.disable();
      this.phoneNumberControl.disable();

      this.streetControl.enable();
      this.numberControl.enable();
      this.cityControl.enable();
      this.postalControl.enable();
      this.buildingControl.enable();
      this.countryControl.enable();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    this.currentAgent = changes.agent?.currentValue;
    let agentType = '';

    if (this.currentAgent) {
      this.resetFormFields();
      this.resetRoleOptions();
      // this.isExisting.next(currentAgent.name.length > 0 || currentAgent.fullName.trim().length > 0);

      for (const role of this.agent.roles[this.entityId] ?? []) {
        for (const roleOption of this.availableRoles) {
          if (roleOption.type === role) roleOption.checked = true;
        }
      }
      this.updateRoles();

      if (this.currentAgent instanceof Person) {
        this.availableContacts.next(Person.getValidContactRefs(this.currentAgent));

        const mostRecentContact = Person.getMostRecentContactRef(this.currentAgent);
        this.agent.setContactRef(mostRecentContact, this.entityId);
        this.selectedContact.next(mostRecentContact);
        agentType = 'person';
      } else if (this.currentAgent instanceof Institution) {
        this.availableAddresses.next(Institution.getValidAddresses(this.currentAgent));

        const mostRecentAddress = Institution.getMostRecentAddress(this.currentAgent);
        this.agent.setAddress(mostRecentAddress, this.entityId);
        this.selectedAddress.next(mostRecentAddress);
        agentType = 'institution';
      }

      this.updateFormFields(this.currentAgent, agentType);
      this.setFormFields();
    }
  }

  resetFormFields() {
    this.prenameControl.setValue('');
    this.nameControl.setValue('');
    this.mailControl.setValue('');

    this.nameControl.setValue('');
    this.streetControl.setValue('');
    this.numberControl.setValue('');
    this.cityControl.setValue('');
    this.postalControl.setValue('');
    this.buildingControl.setValue('');

    this.institutionSelected = false;
    this.personSelected = false;
  }

  resetRoleOptions() {
    for (const roleOption of this.availableRoles) {
      roleOption.checked = false;
    }
  }
}
