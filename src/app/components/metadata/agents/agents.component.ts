import { AsyncPipe } from '@angular/common';
import {
  Component,
  computed,
  input,
  OnChanges,
  OnDestroy,
  signal,
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

import {
  BehaviorSubject,
  combineLatest,
  combineLatestWith,
  firstValueFrom,
  map,
  Observable,
  startWith,
  Subscription,
  tap,
} from 'rxjs';
import { BackendService } from 'src/app/services';
import { MetadataCommunicationService } from 'src/app/services/metadata-communication.service';
import { AgentListComponent } from './agent-list/agent-list.component';
import {
  Collection,
  IInstitution,
  IPerson,
  isAddress,
  isContact,
  isInstitution,
  isPerson,
} from '@kompakkt/common';
import { IsPersonPipe } from 'src/app/pipes/is-person.pipe';
import { IsInstitutionPipe } from 'src/app/pipes/is-institution.pipe';
import { CacheManagerService } from 'src/app/services/cache-manager.service';

const withoutProps = <T, K extends keyof T>(obj: T, ...props: K[]): Omit<T, K> => {
  const copy = { ...obj };
  for (const prop of props) {
    delete copy[prop];
  }
  return copy;
};

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [
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
    IsPersonPipe,
    IsInstitutionPipe,
    AsyncPipe,
  ],
  templateUrl: './agents.component.html',
  styleUrl: './agents.component.scss',
})
export class AgentsComponent implements OnDestroy, OnChanges {
  entity = input.required<AnyEntity>();
  entityId = computed(() => this.entity()._id);

  @ViewChild('agentGroup') agentGroup!: MatTabGroup;

  selectedType = signal<'person' | 'institution'>('person');
  personSelected = computed(() => this.selectedType() === 'person');
  institutionSelected = computed(() => this.selectedType() === 'institution');

  agentIsEditable = signal(false);
  isUpdating = signal(false);
  agentIsSelected = signal(false);

  formControls = {
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

  selectedAgent = signal<Person | Institution | null>(null);

  entitySubject = new BehaviorSubject<AnyEntity | undefined>(undefined);

  availablePersons = this.cache
    .getItem<IPerson[]>('metadata-agents-persons', () =>
      this.backend.getUserDataCollection(Collection.person, { full: true }),
    )
    .pipe(
      map(persons => persons ?? []),
      map(persons => {
        // De-duplication of suggested persons based on their contact references
        const map = new Map<string, IPerson>();
        for (const person of persons) {
          const pairs = Object.values(person.contact_references)
            .filter(isContact)
            .map(cr => withoutProps(cr, '_id', 'creation_date', 'note'))
            .map(cr =>
              Object.values(cr)
                .filter(_ => _)
                .join('-'),
            )
            .filter(pair => pair)
            .flat();
          for (const pair of pairs) {
            map.set(pair, person);
          }
        }
        return Array.from(map.values());
      }),
      tap(persons => console.log('Persons after flattening contact references', persons)),
      map(persons => persons.map(p => new Person(p))),
    );
  availableInstitutions = this.cache
    .getItem<Institution[]>('metadata-agents-institutions', () =>
      this.backend.getUserDataCollection(Collection.institution, { full: true }),
    )
    .pipe(
      map(institutions => institutions ?? []),
      map(institutions => {
        // De-duplication of suggested institutions based on their addresses
        const map = new Map<string, IInstitution>();
        for (const institution of institutions) {
          const pairs = Object.values(institution.addresses)
            .filter(isAddress)
            .map(addr => withoutProps(addr, '_id', 'creation_date'))
            .map(addr =>
              Object.values(addr)
                .filter(_ => _)
                .join('-'),
            )
            .filter(pair => pair)
            .flat();
          for (const pair of pairs) {
            map.set(pair, institution);
          }
        }
        return Array.from(map.values());
      }),
      map(institutions => institutions.map(i => new Institution(i))),
    );
  availableTags = this.cache
    .getItem<Tag[]>('metadata-agents-tags', () =>
      this.backend.getUserDataCollection(Collection.tag),
    )
    .pipe(map(tags => tags ?? []));

  filteredPersons$ = this.formControls.personName.valueChanges.pipe(
    startWith(''),
    map(value => (value as string).toLowerCase()),
    combineLatestWith(this.availablePersons),
    map(([value, persons]) => {
      if (!value) {
        return [];
      }
      return persons.filter(p => p.fullName.toLowerCase().includes(value));
    }),
  );
  filteredPersonsPrename$ = this.formControls.personPrename.valueChanges.pipe(
    startWith(''),
    map(value => (value as string).toLowerCase()),
    combineLatestWith(this.availablePersons),
    map(([value, persons]) => {
      if (!value) {
        return [];
      }
      return persons.filter(p => p.prename.toLowerCase().includes(value));
    }),
  );
  filteredInstitutions$ = this.formControls.institutionName.valueChanges.pipe(
    startWith(''),
    map(value => (value as string).toLowerCase()),
    combineLatestWith(this.availableInstitutions),
    map(([value, institutions]) => {
      if (!value) {
        return [];
      }
      return institutions.filter(i => i.name.toLowerCase().includes(value));
    }),
  );
  filteredAgentList$ = combineLatest([this.filteredPersons$, this.filteredInstitutions$]).pipe(
    map(([persons, institutions]) => {
      if (!this.personSelected() && !this.institutionSelected()) {
        const combinedList = [...persons, ...institutions];
        return combinedList.length > 0 ? combinedList : [];
      }

      if (this.personSelected()) {
        return persons;
      }

      return institutions;
    }),
  );

  private agentSubscription!: Subscription;

  selectedTabIndex = 0;

  availableRoles = [
    { type: 'RIGHTS_OWNER', value: 'Rightsowner', checked: false },
    { type: 'CREATOR', value: 'Creator', checked: false },
    { type: 'EDITOR', value: 'Editor', checked: false },
    { type: 'DATA_CREATOR', value: 'Data creator', checked: false },
    { type: 'CONTACT_PERSON', value: 'Contact person', checked: false },
  ];

  constructor(
    public backend: BackendService,
    public cache: CacheManagerService,
    private metaDataCommunicationService: MetadataCommunicationService,
  ) {
    this.agentSubscription = this.metaDataCommunicationService.selectedAgent$.subscribe(update => {
      if (update && update.entityId === this.entityId()) {
        this.selectAgentToUpdate(update.agent);
      }
    });
  }

  get isFormValid(): boolean {
    if (this.personSelected()) {
      return (
        this.formControls.personPrename.value != '' &&
        this.formControls.personName.value != '' &&
        this.formControls.mail.value != ''
      );
    } else if (this.institutionSelected()) {
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
    return this.personSelected() || this.institutionSelected();
  }

  get currentRoleSelection(): string[] {
    return this.availableRoles.filter(role => role.checked).map(role => role.type);
  }

  get newContactRef(): Address | ContactReference {
    if (this.personSelected()) {
      return new ContactReference({
        mail: this.formControls.mail.value ?? '',
        phonenumber: this.formControls.phoneNumber.value ?? '',
      });
    } else if (this.institutionSelected()) {
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
      this.selectedType.set('person');
    } else if (tabChangeEvent.tab.textLabel === 'Institution') {
      this.selectedType.set('institution');
    }

    if (!this.isUpdating()) {
      this.resetAgentForm();
    } else {
      this.isUpdating.set(false);
      this.agentIsEditable.set(false);
    }
  }

  public async selectExistingAgent(event: MatAutocompleteSelectedEvent) {
    const [agentId, agentType] = event.option.value.split(',');
    if (agentType !== 'person' && agentType !== 'institution')
      throw new Error(`Unknown agent type: ${agentType}`);

    const persons = await firstValueFrom(this.availablePersons);
    const institutions = await firstValueFrom(this.availableInstitutions);

    const currentAgent =
      agentType === 'person'
        ? persons.find(p => p._id === agentId)
        : institutions.find(i => i._id === agentId);

    if (!currentAgent) throw new Error(`Agent with ID ${agentId} not found`);
    this.agentIsSelected.set(true);
    this.setAgentInForm(currentAgent);
  }

  selectAgentToUpdate(agentToUpdate: Person | Institution) {
    this.isUpdating.set(true);
    this.setAgentInForm(agentToUpdate);
    this.selectedAgent.set(agentToUpdate);
  }

  setAgentInForm(agent: Person | Institution) {
    if (isPerson(agent)) {
      this.selectedType.set('person');
      this.selectedTabIndex = 0;
      this.setPersonInForm(agent);
    }
    if (isInstitution(agent)) {
      this.selectedType.set('institution');
      this.selectedTabIndex = 1;
      this.setInstitutionInForm(agent);
    }

    this.agentIsEditable.set(true);

    if (this.isUpdating()) {
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
    if (this.personSelected()) {
      this.addPerson();
    } else if (this.institutionSelected()) {
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
    const currentAgent = this.selectedAgent();
    const currentAgentId = currentAgent?._id.toString();

    const agentOnEntity: Person | Institution | undefined = (() => {
      if (this.personSelected()) {
        const person = this.entity().persons.find(p => p._id.toString() === currentAgentId);
        if (!person) return undefined;
        const contactRef = this.newContactRef;
        if (!isContact(contactRef)) return undefined;
        person.contact_references[this.entityId()] = contactRef;
        return person;
      } else if (this.institutionSelected()) {
        const institution = this.entity().institutions.find(
          i => i._id.toString() === currentAgentId,
        );
        if (!institution) return undefined;
        const address = this.newContactRef;
        if (!isAddress(address)) return undefined;
        institution.addresses[this.entityId()] = address;
        institution.university = this.formControls.university.value ?? '';
        return institution;
      }
      return undefined;
    })();

    if (!agentOnEntity) {
      console.error('Selected agent not found on entity');
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
    this.agentIsSelected.set(false);
    this.isUpdating.set(false);

    this.clearAgentInformation();
    this.clearRoleSelection();
  }

  clearRoleSelection() {
    this.availableRoles.forEach(role => {
      role.checked = false;
    });
  }

  clearAgentInformation() {
    this.agentIsEditable.set(false);
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
    this.selectedAgent.set(null);
    this.metaDataCommunicationService.selectAgent(null);
    this.agentSubscription.unsubscribe();
  }
}
