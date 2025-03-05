import { Component, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import {MatIconModule} from '@angular/material/icon';
import { MatOption } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {MatTabChangeEvent, MatTabGroup, MatTabsModule} from '@angular/material/tabs';

import { TranslatePipe } from '../../../pipes/translate.pipe';
import { Address, AnyEntity, ContactReference, DigitalEntity, Institution, Person, PhysicalEntity, Tag } from 'src/app/metadata';

import { BehaviorSubject, combineLatest, filter, map, Observable, startWith, Subscription, withLatestFrom } from 'rxjs';
import { ContentProviderService, SnackbarService } from 'src/app/services';
import { EntityComponent } from '../entity/entity.component';
import { isDigitalEntity, isPhysicalEntity } from 'src/common/typeguards';
import { AgentCardComponent } from "./agent-card/agent-card.component";
import { AgentListComponent } from "./agent-list/agent-list.component";
import { MetadataCommunicationService } from 'src/app/services/metadata-communication.service';

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatButton,
    MatCheckbox,
    MatDividerModule,
    MatIconModule,
    MatInputModule,
    MatFormField,
    MatLabel,
    MatOption,
    MatTabsModule,
    ReactiveFormsModule,
    TranslatePipe,
    AgentListComponent
],
  templateUrl: './agents.component.html',
  styleUrl: './agents.component.scss',
})
export class AgentsComponent implements OnDestroy, OnChanges {
  @Input() agent!: Person | Institution;
  @Input() entityId!: string;
  @Input() entity!: AnyEntity;

  @ViewChild('agentGroup') agentGroup!: MatTabGroup;

  public personSelected: boolean = true;
  public institutionSelected: boolean = false;
  public agentIsEditable: boolean = false;
  public isUpdating: boolean = false;
  public agentIsSelected: boolean = false;

  private formControlList: FormControl[] = [];

  public institutionName = new FormControl('', {nonNullable: true});
  public personName = new FormControl('', {nonNullable: true});
  public personPrename = new FormControl('', {nonNullable: true});
  public mailControl = new FormControl('', {nonNullable: true});
  public phoneNumberControl = new FormControl('', {nonNullable: true});
  public universityControl = new FormControl('', {nonNullable: true});
  public countryControl = new FormControl('', {nonNullable: true});
  public postalControl = new FormControl('', {nonNullable: true});
  public cityControl = new FormControl('', {nonNullable: true});
  public streetControl = new FormControl('', {nonNullable: true});
  public numberControl = new FormControl('', {nonNullable: true});
  public buildingControl = new FormControl('', {nonNullable: true});

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

  public agentList;

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
        this.formControlList = Object.values(this).filter(control => control instanceof FormControl) as FormControl[];

        this.agentSubscription = this.metaDataCommunicationService.selectedAgent$.subscribe(update => {
          if (update && update.entityId === this.entityId) {
            this.selectAgentToUpdate(update.agent);
          }
        });

        this.content.$Persons.subscribe(persons => {
          this.availablePersons.next(persons.map(p => new Person(p)));
        });

        this.content.$Institutions.subscribe(insts => {
          this.availableInstitutions.next(insts.map(i => new Institution(i)));
        });

        this.filteredPersonsPrename$ = this.personPrename.valueChanges.pipe(
          startWith(''),
          map(value => (value as string).toLowerCase()),
          map(value => {
            if (!value) {
              return [];
            }
            return this.availablePersons.value.filter(p => p.prename.toLowerCase().includes(value));
          }),
        );

        this.filteredPersons$ = this.personName.valueChanges.pipe(
          startWith(''),
          map(value => (value as string).toLowerCase()),
          map(value => {
            if (!value) {
              return [];
            }
            return this.availablePersons.value.filter(p => p.fullName.toLowerCase().includes(value));
          }),
        );

        this.filteredInstitutions$ = this.institutionName.valueChanges.pipe(
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
            if(!this.personSelected && !this.institutionSelected) {
              const combinedList = [...persons, ...institutions];
              return combinedList.length > 0 ? combinedList : [];
            }

            if(this.personSelected) {
              return persons;
            }

            return institutions;
          }),
        );
  }

  get isFormValid(): boolean {
    
    if (this.personSelected) {
      return (
        this.personPrename.value != '' && 
        this.personName.value != '' && 
        this.mailControl.value != ''
      );
    } else if (this.institutionSelected) {
      return (
        this.institutionName.value != '' &&
        this.postalControl.value != '' &&
        this.cityControl.value != '' &&
        this.streetControl.value != ''
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
    if(this.personSelected) {
      return new ContactReference({
        mail: this.mailControl.value ?? '',
        phonenumber: this.phoneNumberControl.value ?? '',
      });
    } else if(this.institutionSelected) {
      return new Address({
        street: this.streetControl.value ?? '',
        number: this.numberControl.value ?? '',
        postcode: this.postalControl.value ?? '',
        city: this.cityControl.value ?? '',
        country: this.countryControl.value ?? '',
        building: this.buildingControl.value ?? '',
      });
    }

    return new Address;
  }

  public currentAgentSelection(tabChangeEvent: MatTabChangeEvent) {
    if(tabChangeEvent.tab.textLabel === 'Person') {
      this.personSelected = true;
      this.institutionSelected = false;
    } else if(tabChangeEvent.tab.textLabel === 'Institution') {
      this.personSelected = false;
      this.institutionSelected = true;
    }

    if(!this.isUpdating) {
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
    let currentAgent;

    switch (agentType) {
      case 'person':
        currentAgent = this.availablePersons.value.find(p => p._id === agentId);
        break;
      case 'institution':
        currentAgent = this.availableInstitutions.value.find(i => i._id === agentId);
        break;
      default:
        return console.warn(`Could not find institution with id ${agentId}`);
    }

    this.agentIsSelected = true;

    this.setAgentInForm(currentAgent);
  }

  selectAgentToUpdate(agentToUpdate) {
    this.isUpdating = true;
    this.setAgentInForm(agentToUpdate);
    this.selectedAgent = agentToUpdate;
  }

  setAgentInForm(agent) {
    if(this.isPerson(agent)) {
      this.personSelected = true;
      this.institutionSelected = false;
      this.selectedTabIndex = 0;
    }
    if(this.isInstitution(agent)) {
      this.personSelected = false;
      this.institutionSelected = true;
      this.selectedTabIndex = 1;
    }

    this.agentIsEditable = true;

    if(this.personSelected) {
      this.setPersonInForm(agent);
    }
    if(this.institutionSelected) {
      this.setInstitutionInForm(agent);
    }
    
    if(this.isUpdating) {
        this.clearRoleSelection();

        for(const role of agent.roles[this.entityId] ?? []) {
          for(const roleOption of this.availableRoles) {
            if(roleOption.type === role) roleOption.checked = true;
          }
        }
    }
  }

  setPersonInForm(agent: Person) {
    this.personPrename.setValue(agent.prename);
    this.personPrename.disable();
    this.personName.setValue(agent.name);
    this.personName.disable();

    const mostRecentContactRef = Person.getMostRecentContactRef(agent);
    this.mailControl.setValue(mostRecentContactRef.mail);
    this.mailControl.disable();
    this.phoneNumberControl.setValue(mostRecentContactRef.phonenumber);
    this.phoneNumberControl.disable();
  }

  setInstitutionInForm(agent: Institution) {
    this.institutionName.setValue(agent.name);
    this.institutionName.disable();
    this.universityControl.setValue(agent.university);
    this.universityControl.disable();
    

    const mostRecentAdress = Institution.getMostRecentAddress(agent);
    this.countryControl.setValue(mostRecentAdress.country);
    this.countryControl.disable();
    this.postalControl.setValue(mostRecentAdress.postcode);
    this.postalControl.disable();
    this.cityControl.setValue(mostRecentAdress.city);
    this.cityControl.disable();
    this.streetControl.setValue(mostRecentAdress.street);
    this.streetControl.disable();
    this.numberControl.setValue(mostRecentAdress.number);
    this.numberControl.disable();
    this.buildingControl.setValue(mostRecentAdress.building);
    this.buildingControl.disable();
  }

  public addNewAgentToEntity() {
    if(this.personSelected) {
      this.addPerson();
    } else if(this.institutionSelected) {
      this.addInstitution();
    }

    this.resetAgentForm();
  }

  private addPerson() {
    const personInstance = new Person({
      prename: this.personPrename.value ?? '',
      name: this.personName.value ?? '',
    });

    personInstance.contact_references[this.entityId] = this.newContactRef as ContactReference;
    personInstance.roles[this.entityId] = this.currentRoleSelection;
    this.entity.addPerson(personInstance);

    this.metaDataCommunicationService.setEntity(this.entity, this.entityId);
  }

  private addInstitution() {
    const institutionInstance = new Institution({
            name: this.institutionName.value ?? '',
    });
    
    institutionInstance.addresses[this.entityId] = this.newContactRef as Address;
    institutionInstance.roles[this.entityId] = this.currentRoleSelection;

    this.entity.addInstitution(institutionInstance);
    this.metaDataCommunicationService.setEntity(this.entity, this.entityId);
  }

  public updateAgent() {
    const currentAgent = this.selectedAgent;
    const currentAgentId = currentAgent?._id.toString();

    let agentOnEntity;

    if(this.personSelected) {
      agentOnEntity = this.entity.persons.find((person) => person._id.toString() == currentAgentId);
      agentOnEntity.contact_references[this.entityId] = this.newContactRef;
    } else if(this.institutionSelected) {
      agentOnEntity = this.entity.institutions.find((institution) => institution._id.toString() == currentAgentId);
      agentOnEntity.university = this.universityControl.value;

      agentOnEntity.addresses[this.entityId] = this.newContactRef;

    } else {
      return;
    }

    agentOnEntity.roles[this.entityId] = this.currentRoleSelection;

    this.resetAgentForm();
    this.metaDataCommunicationService.selectAgent(null, null);
    this.metaDataCommunicationService.setEntity(this.entity, this.entityId);
  }

  onEditAgent(inputElementString: string) {
    let currentFormControl;

    switch (inputElementString) {
      case 'mail':
        currentFormControl = this.mailControl;
        break;
      case 'phone':
        currentFormControl = this.phoneNumberControl;
        break;
      case 'university':
        currentFormControl = this.mailControl;
        break;
      case 'country':
        currentFormControl = this.countryControl;
        break;
      case 'postalCode':
        currentFormControl = this.postalControl;
        break;
      case 'city':
        currentFormControl = this.cityControl;
        break;
      case 'street':
        currentFormControl = this.streetControl;
        break;
      case 'number':
        currentFormControl = this.numberControl;
        break;
      case 'building':
        currentFormControl = this.buildingControl;
        break;
      default:
        break;
    }

    currentFormControl.enable();
  }

  resetAgentForm() {
    this.personSelected = true;
    this.institutionSelected = false;
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

    this.formControlList.forEach(control => {
      control.reset();
      control.enable();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log("Agents-Component => ", changes);

    let currentEntity = changes.entity?.currentValue;

    this.metaDataCommunicationService.setEntity(currentEntity, this.entityId);
  }

  ngOnDestroy(): void {
    this.resetAgentForm();
    this.selectedAgent = null;
    this.metaDataCommunicationService.selectAgent(null, null);
  }

}
