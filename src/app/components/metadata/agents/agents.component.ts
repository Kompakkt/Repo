import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  input,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabChangeEvent, MatTabGroup, MatTabsModule } from '@angular/material/tabs';

import { Address, AnyEntity, ContactReference, Institution, Person, Tag } from 'src/app/metadata';
import { TranslatePipe } from '../../../pipes/translate.pipe';

import { BehaviorSubject, combineLatest, map, Observable, startWith, Subscription } from 'rxjs';
import { ContentProviderService } from 'src/app/services';
import { MetadataCommunicationService } from 'src/app/services/metadata-communication.service';
import { AgentListComponent } from './agent-list/agent-list.component';

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDividerModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatOptionModule,
    MatTabsModule,
    ReactiveFormsModule,
    TranslatePipe,
    AgentListComponent,
  ],
  templateUrl: './agents.component.html',
  styleUrl: './agents.component.scss',
})
export class AgentsComponent implements OnDestroy, OnChanges {
  entity = input.required<AnyEntity>();
  entityId = computed(() => this.entity()._id);

  @ViewChild('agentGroup') agentGroup!: MatTabGroup;

  public personSelected: boolean = true;
  public institutionSelected: boolean = false;
  public agentIsEditable: boolean = false;
  public isUpdating: boolean = false;
  public agentIsSelected: boolean = false;

  public formControls = {
    institutionName: new FormControl('', { nonNullable: true }),
    personName: new FormControl('', { nonNullable: true }),
    personPrename: new FormControl('', { nonNullable: true }),
    mail: new FormControl('', { nonNullable: true }),
    phoneNumber: new FormControl('', { nonNullable: true }),
    university: new FormControl('', { nonNullable: true }),
    country: new FormControl('', { nonNullable: true }),
    postal: new FormControl('', { nonNullable: true }),
    city: new FormControl('', { nonNullable: true }),
    street: new FormControl('', { nonNullable: true }),
    number: new FormControl('', { nonNullable: true }),
    building: new FormControl('', { nonNullable: true }),
  };

  public selectedAgent: Person | Institution | null = null;

  public entitySubject = new BehaviorSubject<AnyEntity | undefined>(undefined);

  public availablePersons = new BehaviorSubject<Person[]>([]);
  public availableInstitutions = new BehaviorSubject<Institution[]>([]);
  public availableTags = new BehaviorSubject<Tag[]>([]);

  public filteredPersons$: Observable<Person[]>;
  public filteredPersonsPrename$: Observable<Person[]>;
  public filteredInstitutions$: Observable<Institution[]>;
  public filteredAgentList$: Observable<(Person | Institution)[]>;

  private agentSubscription!: Subscription;

  selectedTabIndex = 0;

  public availableRoles = [
    { type: 'RIGHTS_OWNER', value: 'Rightsowner', checked: false },
    { type: 'CREATOR', value: 'Creator', checked: false },
    { type: 'EDITOR', value: 'Editor', checked: false },
    { type: 'DATA_CREATOR', value: 'Data creator', checked: false },
    { type: 'CONTACT_PERSON', value: 'Contact person', checked: false },
  ];

  constructor(
    public content: ContentProviderService,
    private metaDataCommunicationService: MetadataCommunicationService,
  ) {
    this.agentSubscription = this.metaDataCommunicationService.selectedAgent$.subscribe(update => {
      if (update && update.entityId === this.entityId()) {
        this.selectAgentToUpdate(update.agent);
      }
    });

    this.content.$Persons.subscribe(persons => {
      this.availablePersons.next(persons.map(p => new Person(p)));
    });

    this.content.$Institutions.subscribe(insts => {
      this.availableInstitutions.next(insts.map(i => new Institution(i)));
    });

    this.filteredPersonsPrename$ = this.formControls.personPrename.valueChanges.pipe(
      startWith(''),
      map(value => (value as string).toLowerCase()),
      map(value => {
        if (!value) {
          return [];
        }
        return this.availablePersons.value.filter(p => p.prename.toLowerCase().includes(value));
      }),
    );

    this.filteredPersons$ = this.formControls.personName.valueChanges.pipe(
      startWith(''),
      map(value => (value as string).toLowerCase()),
      map(value => {
        if (!value) {
          return [];
        }
        return this.availablePersons.value.filter(p => p.fullName.toLowerCase().includes(value));
      }),
    );

    this.filteredInstitutions$ = this.formControls.institutionName.valueChanges.pipe(
      startWith(''),
      map(value => (value as string).toLowerCase()),
      map(value => {
        if (!value) {
          return [];
        }
        return this.availableInstitutions.value.filter(i => i.name.toLowerCase().includes(value));
      }),
    );

    this.filteredAgentList$ = combineLatest([
      this.filteredPersons$,
      this.filteredInstitutions$,
    ]).pipe(
      map(([persons, institutions]) => {
        if (!this.personSelected && !this.institutionSelected) {
          const combinedList = [...persons, ...institutions];
          return combinedList.length > 0 ? combinedList : [];
        }

        if (this.personSelected) {
          return persons;
        }

        return institutions;
      }),
    );
  }

  get isFormValid(): boolean {
    if (this.personSelected) {
      return (
        this.formControls.personPrename.value != '' &&
        this.formControls.personName.value != '' &&
        this.formControls.mail.value != ''
      );
    } else if (this.institutionSelected) {
      return (
        this.formControls.institutionName.value != '' &&
        this.formControls.postal.value != '' &&
        this.formControls.city.value != '' &&
        this.formControls.street.value != ''
      );
    } else return false;
  }

  get atLeastOneRoleSelected(): boolean {
    return this.availableRoles.some(role => role.checked);
  }

  get selectionIsValid(): boolean {
    return this.personSelected || this.institutionSelected;
  }

  get currentRoleSelection(): string[] {
    return this.availableRoles.filter(role => role.checked).map(role => role.type);
  }

  get newContactRef(): Address | ContactReference {
    if (this.personSelected) {
      return new ContactReference({
        mail: this.formControls.mail.value ?? '',
        phonenumber: this.formControls.phoneNumber.value ?? '',
      });
    } else if (this.institutionSelected) {
      return new Address({
        street: this.formControls.street.value ?? '',
        number: this.formControls.number.value ?? '',
        postcode: this.formControls.postal.value ?? '',
        city: this.formControls.city.value ?? '',
        country: this.formControls.country.value ?? '',
        building: this.formControls.building.value ?? '',
      });
    }

    return new Address();
  }

  public currentAgentSelection(tabChangeEvent: MatTabChangeEvent) {
    if (tabChangeEvent.tab.textLabel === 'Person') {
      this.personSelected = true;
      this.institutionSelected = false;
    } else if (tabChangeEvent.tab.textLabel === 'Institution') {
      this.personSelected = false;
      this.institutionSelected = true;
    }

    if (!this.isUpdating) {
      this.resetAgentForm();
    } else {
      this.isUpdating = false;
      this.agentIsEditable = false;
    }
  }

  public isPerson(agent: Person | Institution): agent is Person {
    return (agent as Person).fullName !== undefined;
  }

  public isInstitution(agent: Person | Institution): agent is Institution {
    return (agent as Institution).addresses !== undefined;
  }

  public selectExistingAgent(event: MatAutocompleteSelectedEvent): void {
    const [agentId, agentType] = event.option.value.split(',');
    if (agentType !== 'person' && agentType !== 'institution')
      throw new Error(`Unknown agent type: ${agentType}`);

    const currentAgent =
      agentType === 'person'
        ? this.availablePersons.value.find(p => p._id === agentId)
        : this.availableInstitutions.value.find(i => i._id === agentId);

    if (!currentAgent) throw new Error(`Agent with ID ${agentId} not found`);
    this.agentIsSelected = true;
    this.setAgentInForm(currentAgent);
  }

  selectAgentToUpdate(agentToUpdate: Person | Institution) {
    this.isUpdating = true;
    this.setAgentInForm(agentToUpdate);
    this.selectedAgent = agentToUpdate;
  }

  setAgentInForm(agent: Person | Institution) {
    if (this.isPerson(agent)) {
      this.personSelected = true;
      this.institutionSelected = false;
      this.selectedTabIndex = 0;
      this.setPersonInForm(agent);
    }
    if (this.isInstitution(agent)) {
      this.personSelected = false;
      this.institutionSelected = true;
      this.selectedTabIndex = 1;
      this.setInstitutionInForm(agent);
    }

    this.agentIsEditable = true;

    if (this.isUpdating) {
      this.clearRoleSelection();

      for (const role of agent.roles[this.entityId()] ?? []) {
        for (const roleOption of this.availableRoles) {
          if (roleOption.type === role) roleOption.checked = true;
        }
      }
    }
  }

  setPersonInForm(agent: Person) {
    this.formControls.personPrename.setValue(agent.prename);
    this.formControls.personPrename.disable();
    this.formControls.personName.setValue(agent.name);
    this.formControls.personName.disable();

    const mostRecentContactRef = Person.getMostRecentContactRef(agent);
    this.formControls.mail.setValue(mostRecentContactRef.mail);
    this.formControls.mail.disable();
    this.formControls.phoneNumber.setValue(mostRecentContactRef.phonenumber);
    this.formControls.phoneNumber.disable();
  }

  setInstitutionInForm(agent: Institution) {
    this.formControls.institutionName.setValue(agent.name);
    this.formControls.institutionName.disable();
    this.formControls.university.setValue(agent.university);
    this.formControls.university.disable();

    const mostRecentAdress = Institution.getMostRecentAddress(agent);
    this.formControls.country.setValue(mostRecentAdress.country);
    this.formControls.country.disable();
    this.formControls.postal.setValue(mostRecentAdress.postcode);
    this.formControls.postal.disable();
    this.formControls.city.setValue(mostRecentAdress.city);
    this.formControls.city.disable();
    this.formControls.street.setValue(mostRecentAdress.street);
    this.formControls.street.disable();
    this.formControls.number.setValue(mostRecentAdress.number);
    this.formControls.number.disable();
    this.formControls.building.setValue(mostRecentAdress.building);
    this.formControls.building.disable();
  }

  public addNewAgentToEntity() {
    if (this.personSelected) {
      this.addPerson();
    } else if (this.institutionSelected) {
      this.addInstitution();
    }

    this.resetAgentForm();
  }

  private addPerson() {
    const personInstance = new Person({
      prename: this.formControls.personPrename.value ?? '',
      name: this.formControls.personName.value ?? '',
    });

    personInstance.contact_references[this.entityId()] = this.newContactRef as ContactReference;
    personInstance.roles[this.entityId()] = this.currentRoleSelection;

    this.entity().addPerson(personInstance);
    this.metaDataCommunicationService.setEntity(this.entity());
  }

  private addInstitution() {
    const institutionInstance = new Institution({
      name: this.formControls.institutionName.value ?? '',
    });

    institutionInstance.addresses[this.entityId()] = this.newContactRef as Address;
    institutionInstance.roles[this.entityId()] = this.currentRoleSelection;

    this.entity().addInstitution(institutionInstance);
    this.metaDataCommunicationService.setEntity(this.entity());
  }

  public updateAgent() {
    const currentAgent = this.selectedAgent;
    const currentAgentId = currentAgent?._id.toString();

    let agentOnEntity;

    if (this.personSelected) {
      agentOnEntity = this.entity().persons.find(person => person._id.toString() == currentAgentId);
      agentOnEntity.contact_references[this.entityId()] = this.newContactRef;
    } else if (this.institutionSelected) {
      agentOnEntity = this.entity().institutions.find(
        institution => institution._id.toString() == currentAgentId,
      );
      agentOnEntity.university = this.formControls.university.value;

      agentOnEntity.addresses[this.entityId()] = this.newContactRef;
    } else {
      return;
    }

    agentOnEntity.roles[this.entityId()] = this.currentRoleSelection;

    this.resetAgentForm();
    this.metaDataCommunicationService.selectAgent(null);
    this.metaDataCommunicationService.setEntity(this.entity());
  }

  onEditAgent(inputElementString: string) {
    const currentFormControl = {
      mail: this.formControls.mail,
      phone: this.formControls.phoneNumber,
      university: this.formControls.university,
      country: this.formControls.country,
      postalCode: this.formControls.postal,
      city: this.formControls.city,
      street: this.formControls.street,
      number: this.formControls.number,
      building: this.formControls.building,
    }[inputElementString];

    currentFormControl?.enable();
  }

  resetAgentForm() {
    this.agentIsSelected = false;
    this.isUpdating = false;

    this.clearAgentInformation();
    this.clearRoleSelection();
  }

  clearRoleSelection() {
    this.availableRoles.forEach(role => {
      role.checked = false;
    });
  }

  clearAgentInformation() {
    this.agentIsEditable = false;
    Object.values(this.formControls).forEach(control => {
      control.reset();
      control.enable();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('Agents-Component => ', changes);

    let currentEntity = changes.entity?.currentValue;

    this.metaDataCommunicationService.setEntity(currentEntity);
  }

  ngOnDestroy(): void {
    this.resetAgentForm();
    this.selectedAgent = null;
    this.metaDataCommunicationService.selectAgent(null);
  }
}
