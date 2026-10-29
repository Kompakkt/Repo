import {
  Component,
  computed,
  input,
  OnInit,
  signal,
  viewChild,
  model,
  inject,
  effect,
  PipeTransform,
  Pipe,
} from '@angular/core';

import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatOption, MatOptionModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabChangeEvent, MatTabGroup, MatTabsModule } from '@angular/material/tabs';

import {
  Address,
  AnyEntity,
  cloneEntity,
  ContactReference,
  DigitalEntity,
  Institution,
  Person,
  PhysicalEntity,
} from 'src/app/metadata';
import { TranslatePipe } from '../../../pipes/translate.pipe';

import { AccountService, BackendService } from 'src/app/services';
import { AgentListComponent } from './agent-list/agent-list.component';
import {
  IInstitution,
  IPerson,
  isAddress,
  isContact,
  isDigitalEntity,
  isInstitution,
  isPerson,
} from '@kompakkt/common';
import { IsPersonPipe } from 'src/app/pipes/is-person.pipe';
import { IsInstitutionPipe } from 'src/app/pipes/is-institution.pipe';
import { CacheManagerService } from 'src/app/services/cache-manager.service';
import { isAgentInEntity, IsAgentInEntityPipe } from './is-agent-in-entity.pipe';
import { IsAgentSelfPipe } from './is-agent-self.pipe';
import { OutlinedInputComponent } from '../../outlined-input/outlined-input.component';
import {
  applyWhenValue,
  disabled,
  FieldTree,
  form,
  FormField,
  required,
  validate,
} from '@angular/forms/signals';
import { WrappedModel } from '../metadata-util';

const withoutProps = <T, K extends keyof T>(obj: T, ...props: K[]): Omit<T, K> => {
  const copy = { ...obj };
  for (const prop of props) {
    delete copy[prop];
  }
  return copy;
};

type RoleEntry = {
  type: string;
  value: string;
  checked: boolean;
};
const emptyRoleEntry = (): RoleEntry => ({
  type: `EMPTY_CUSTOM-${Date.now()}`,
  value: '',
  checked: false,
});

const DEFAULT_ROLES: RoleEntry[] = [
  { type: 'RIGHTS_OWNER', value: 'Rightsowner', checked: false },
  { type: 'CONTACT_PERSON', value: 'Contact person', checked: false },
];

@Pipe({ name: 'isDefaultRole' })
export class IsDefaultRolePipe implements PipeTransform {
  transform(role: RoleEntry, roleArr = DEFAULT_ROLES) {
    return roleArr.some(r => r.type === role.type);
  }
}

type PersonModel = WrappedModel<{
  surname: string;
  prename: string;
  mail: string;
  phoneNumber: string;
}> & { __kind: 'person' };
const emptyPerson = (): PersonModel => ({
  __kind: 'person',
  __prefilled: false,
  __editing: [],
  prename: '',
  surname: '',
  mail: '',
  phoneNumber: '',
});

type InstitutionModel = WrappedModel<{
  name: string;
  university: string;
  country: string;
  postal: string;
  city: string;
  street: string;
  number: string;
  building: string;
}> & { __kind: 'institution' };
const emptyInstitution = (): InstitutionModel => ({
  __kind: 'institution',
  __prefilled: false,
  __editing: [],
  name: '',
  university: '',
  country: '',
  postal: '',
  city: '',
  street: '',
  number: '',
  building: '',
});

type AgentModel = PersonModel | InstitutionModel;
type PersonModelKeys = keyof Omit<PersonModel, '__kind' | '__prefilled' | '__editing'>;
type InstitutionModelKeys = keyof Omit<InstitutionModel, '__kind' | '__prefilled' | '__editing'>;

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [
    FormField,
    MatAutocompleteModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDividerModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatOptionModule,
    MatTabsModule,
    TranslatePipe,
    AgentListComponent,
    IsPersonPipe,
    IsInstitutionPipe,
    IsAgentInEntityPipe,
    IsAgentSelfPipe,
    IsDefaultRolePipe,
    OutlinedInputComponent,
  ],
  templateUrl: './agents.component.html',
  styleUrl: './agents.component.scss',
})
export class AgentsComponent implements OnInit {
  account = inject(AccountService);
  backend = inject(BackendService);
  cache = inject(CacheManagerService);

  entity = model.required<AnyEntity>();
  entityId = computed(() => this.entity()._id);

  isPhysicalObject = input<boolean>(false);

  agentGroup = viewChild.required<MatTabGroup>('agentGroup');

  agentModel = model<AgentModel>(emptyPerson());
  agentForm = form(this.agentModel, path => {
    applyWhenValue(
      path,
      data => data.__kind === 'person',
      ctx => {
        required(ctx.prename);
        required(ctx.surname);
        required(ctx.mail);

        disabled(ctx.prename, {
          when: schema =>
            schema.valueOf(ctx.__prefilled) && !schema.valueOf(ctx.__editing).includes('prename'),
        });
        disabled(ctx.surname, {
          when: schema =>
            schema.valueOf(ctx.__prefilled) && !schema.valueOf(ctx.__editing).includes('surname'),
        });
        disabled(ctx.mail, {
          when: schema =>
            schema.valueOf(ctx.__prefilled) && !schema.valueOf(ctx.__editing).includes('mail'),
        });
        disabled(ctx.phoneNumber, {
          when: schema =>
            schema.valueOf(ctx.__prefilled) &&
            !schema.valueOf(ctx.__editing).includes('phoneNumber'),
        });
      },
    );
    applyWhenValue(
      path,
      data => data.__kind === 'institution',
      ctx => {
        required(ctx.name);
        required(ctx.postal);
        required(ctx.city);
        required(ctx.street);

        disabled(ctx.name, {
          when: schema =>
            schema.valueOf(ctx.__prefilled) && !schema.valueOf(ctx.__editing).includes('name'),
        });
        disabled(ctx.university, {
          when: schema =>
            schema.valueOf(ctx.__prefilled) &&
            !schema.valueOf(ctx.__editing).includes('university'),
        });
        disabled(ctx.country, {
          when: schema =>
            schema.valueOf(ctx.__prefilled) && !schema.valueOf(ctx.__editing).includes('country'),
        });
        disabled(ctx.postal, {
          when: schema =>
            schema.valueOf(ctx.__prefilled) && !schema.valueOf(ctx.__editing).includes('postal'),
        });
        disabled(ctx.city, {
          when: schema =>
            schema.valueOf(ctx.__prefilled) && !schema.valueOf(ctx.__editing).includes('city'),
        });
        disabled(ctx.street, {
          when: schema =>
            schema.valueOf(ctx.__prefilled) && !schema.valueOf(ctx.__editing).includes('street'),
        });
        disabled(ctx.building, {
          when: schema =>
            schema.valueOf(ctx.__prefilled) && !schema.valueOf(ctx.__editing).includes('building'),
        });
        disabled(ctx.number, {
          when: schema =>
            schema.valueOf(ctx.__prefilled) && !schema.valueOf(ctx.__editing).includes('number'),
        });
      },
    );
  });
  selectedKind = computed(() => this.agentForm().value().__kind);
  personForm = computed(() => {
    const form = this.agentForm;
    if (this.agentForm().value().__kind !== 'person') return undefined;
    return form as FieldTree<PersonModel, string | number, 'writable'>;
  });
  institutionForm = computed(() => {
    const form = this.agentForm;
    if (this.agentForm().value().__kind !== 'institution') return undefined;
    return form as FieldTree<InstitutionModel, string | number, 'writable'>;
  });
  isPrefilled = computed(() => this.agentForm().value().__prefilled);
  isUpdating = computed(() => {
    const entity = this.entity();
    const agent = this.selectedAgent();
    if (!agent) return false;
    return isAgentInEntity({
      entity,
      agent,
      entityId: entity._id,
    });
  });

  selectedAgent = signal<Person | Institution | null>(null);

  #selfAsPerson = computed(() => {
    const user = this.account.user();
    if (!user) return null;
    const entityId = this.entityId();
    if (!entityId) return null;
    const selfAsPerson = new Person({
      prename: user.prename,
      name: user.surname,
    });
    selfAsPerson.contact_references[entityId] = new ContactReference({
      mail: user.mail,
    });
    return selfAsPerson;
  });

  #personsResource = this.cache.cachedResource(
    () => 'metadata-agents-persons',
    () => this.backend.getUserDataPersons({ full: true }),
  );
  #mappedPersons = computed(() => {
    const persons = this.#personsResource.value() ?? [];
    // De-duplication of suggested persons based on their contact references
    const map = new Map<string, IPerson>();
    for (const person of persons) {
      const pairs = Object.values(person.contact_references)
        .filter(isContact)
        .map(cr => withoutProps(cr, '_id', 'creation_date', 'note'))
        .filter(pair => Object.values(pair).filter(_ => _).length > 0)
        .flat();
      for (const pair of pairs) {
        const pairString = Object.values(pair).join('-');
        map.set(pairString, {
          ...person,
          contact_references: {
            ...person.contact_references,
            [this.entityId()]:
              person.contact_references[this.entityId()] ??
              new ContactReference({
                mail: pair.mail,
                phonenumber: pair.phonenumber,
              }),
          },
        });
      }
    }
    return Array.from(map.values()).map(p => new Person(p));
  });
  availablePersons = computed(() => {
    const persons = this.#mappedPersons();
    const self = this.#selfAsPerson();
    if (!self) return persons;
    if (persons.find(p => p.mostRecentContactRef?.mail === self.mostRecentContactRef?.mail))
      return persons;
    // Prepend self as option
    return [self, ...persons];
  });

  #institutionsResource = this.cache.cachedResource(
    () => 'metadata-agents-institutions',
    () => this.backend.getUserDataInstitutions({ full: true }),
  );
  #mappedInstitutions = computed(() => {
    const institutions = this.#institutionsResource.value() ?? [];
    // De-duplication of suggested institutions based on their addresses
    const map = new Map<string, IInstitution>();
    for (const institution of institutions) {
      const pairs = Object.values(institution.addresses)
        .filter(isAddress)
        .map(cr => withoutProps(cr, '_id', 'creation_date'))
        .filter(pair => Object.values(pair).filter(_ => _).length > 0)
        .flat();
      for (const pair of pairs) {
        const pairString = Object.values(pair).join('-');
        map.set(pairString, {
          ...institution,
          addresses: {
            ...institution.addresses,
            [this.entityId()]:
              institution.addresses[this.entityId()] ??
              new Address({
                building: pair.building,
                number: pair.number,
                street: pair.street,
                postcode: pair.postcode,
                city: pair.city,
                country: pair.country,
              }),
          },
        });
      }
    }
    return Array.from(map.values()).map(i => new Institution(i));
  });
  availableInstitutions = computed(() => this.#mappedInstitutions());

  #tagsResource = this.cache.cachedResource(
    () => 'metadata-agents-tags',
    () => this.backend.getUserDataTags({}),
  );
  availableTags = computed(() => this.#tagsResource.value() ?? []);

  filteredPersons = computed(() => {
    const data = this.agentForm().value();
    const persons = this.availablePersons() ?? [];
    if (data.__kind !== 'person') return [];
    const prename = data.prename.trim().toLowerCase();
    const surname = data.surname.trim().toLowerCase();
    if (!prename && !surname) return persons;
    return persons.filter(
      person =>
        person.prename.toLowerCase().includes(prename) ||
        person.name.toLowerCase().includes(surname),
    );
  });
  filteredInstitutions = computed(() => {
    const data = this.agentForm().value();
    const institutions = this.availableInstitutions() ?? [];
    if (data.__kind !== 'institution') return [];
    const name = data.name.trim().toLowerCase();
    if (!name) return institutions;
    return institutions.filter(institution => institution.name.toLowerCase().includes(name));
  });

  selectedTabIndex = model<number>(0);

  roleModel = model<RoleEntry[]>([...DEFAULT_ROLES, emptyRoleEntry()]);
  roleForm = form(this.roleModel, path => {
    validate(path, ctx => {
      if (!ctx.value().some(role => role.checked && role.value.trim().length > 0)) {
        return {
          kind: 'error',
          message: 'At least one role must be selected',
        };
      }
      return null;
    });
  });

  #getCurrentRoleSelection(): string[] {
    const data = this.roleForm().value();
    return data
      .filter(role => role.checked && role.value.trim().length > 0)
      .map(role => {
        if (role.type.startsWith('EMPTY_CUSTOM-'))
          return this.entity().formatRoleLabel(role.value.trim());
        return role.type;
      });
  }

  #getAddress(): Address | undefined {
    const data = this.agentForm().value();
    if (data.__kind !== 'institution') return undefined;
    return new Address({ ...data });
  }

  #getContactRef(): ContactReference | undefined {
    const data = this.agentForm().value();
    if (data.__kind !== 'person') return undefined;
    return new ContactReference({ ...data });
  }

  public updateCustomRole(role: RoleEntry, value: string) {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      this.roleForm().value.update(roles =>
        roles.map(r =>
          r.type === role.type ? { value: trimmed, type: role.type, checked: role.checked } : r,
        ),
      );
      this.addCustomRoleSlot();
    } else {
      this.roleForm().value.update(roles =>
        roles
          .map(r =>
            r.type === role.type ? { value: trimmed, type: role.type, checked: role.checked } : r,
          )
          .filter(r => r.type === role.type || r.value.trim().length > 0),
      );
    }
  }

  public addCustomRoleSlot() {
    const roles = this.roleForm().value();
    if (roles.some(r => r.value.trim().length === 0)) return;
    this.roleForm().value.update(roles => [...roles, emptyRoleEntry()]);
  }

  public selectExistingAgent(event: MatAutocompleteSelectedEvent) {
    const [agentId, agentType] = (event.option as MatOption<string>).value.split(',');
    if (agentType !== 'person' && agentType !== 'institution')
      throw new Error(`Unknown agent type: ${agentType}`);

    const currentAgent =
      agentType === 'person'
        ? this.availablePersons().find(p => p._id === agentId)
        : this.availableInstitutions().find(i => i._id === agentId);

    if (!currentAgent) throw new Error(`Agent with ID ${agentId} not found`);
    this.setAgentInForm(currentAgent, false);
  }

  _onSelectedAgentEffectRef = effect(() => {
    const agent = this.selectedAgent();
    if (!agent) return;
    this.setAgentInForm(agent, true);
  });

  setAgentInForm(agent: Person | Institution, clearRoles: boolean) {
    if (isPerson(agent)) {
      this.selectedTabIndex.set(0);
    } else if (isInstitution(agent)) {
      this.selectedTabIndex.set(1);
    }

    this.agentForm().value.update(v => {
      if (v.__kind === 'person' && agent instanceof Person) {
        const mostRecentContactRef = Person.getMostRecentContactRef(agent);
        return {
          ...v,
          prename: agent.prename,
          surname: agent.name,
          mail: mostRecentContactRef.mail,
          phoneNumber: mostRecentContactRef.phonenumber,
          __prefilled: true,
        };
      } else if (v.__kind === 'institution' && agent instanceof Institution) {
        const mostRecentAdress = Institution.getMostRecentAddress(agent);
        return {
          ...v,
          name: agent.name,
          university: agent.university,
          country: mostRecentAdress.country,
          postal: mostRecentAdress.postcode,
          city: mostRecentAdress.city,
          street: mostRecentAdress.street,
          number: mostRecentAdress.number,
          building: mostRecentAdress.building,
          __prefilled: true,
        };
      }
      return { ...v };
    });

    if (clearRoles) {
      this.clearRoleSelection();
      const rolesToActivate = agent.roles[this.entityId()] ?? [];
      this.roleForm().value.update(roles =>
        roles.map(role => ({ ...role, checked: rolesToActivate.includes(role.type) })),
      );
    }
  }

  public addNewAgentToEntity() {
    const data = this.agentForm().value();
    const entityId = this.entityId();
    const roles = this.#getCurrentRoleSelection();
    if (data.__kind === 'person') {
      const contactRef = this.#getContactRef();
      if (!contactRef) return;
      const personInstance = new Person({ prename: data.prename, name: data.surname });
      personInstance.contact_references[entityId] = contactRef;
      personInstance.roles[entityId] = roles;
      this.entity.update(entity => {
        const clone = cloneEntity(entity);
        clone.persons.push(personInstance);
        return clone;
      });
    } else if (data.__kind === 'institution') {
      const address = this.#getAddress();
      if (!address) return;
      const institutionInstance = new Institution({ name: data.name });
      institutionInstance.addresses[entityId] = address;
      institutionInstance.roles[entityId] = roles;
      this.entity.update(entity => {
        const clone = cloneEntity(entity);
        clone.institutions.push(institutionInstance);
        return clone;
      });
    }
    this.resetAgentForm();
  }

  public updateRoleState(event: MatCheckboxChange, roleType: string) {
    this.roleForm().value.update(roles =>
      roles.map(role => ({
        ...role,
        checked: role.type === roleType ? event.checked : role.checked,
      })),
    );
  }

  private addRoleIfNotExists(newRoleName: string) {
    const entity = this.entity();
    const cleanedUpRoleName = entity.formatRoleLabel(newRoleName);
    const currentRoles = this.roleForm().value();
    if (!cleanedUpRoleName || currentRoles.some(r => r.value === cleanedUpRoleName)) {
      return;
    }

    this.roleForm().value.update(roles => [
      ...roles,
      { type: cleanedUpRoleName, value: cleanedUpRoleName, checked: false },
    ]);
  }

  public updateAgent() {
    const currentAgent = this.selectedAgent();
    const currentAgentId = currentAgent?._id.toString();
    const data = this.agentForm().value();
    const entityId = this.entityId();

    if (data.__kind === 'person') {
      this.entity.update(entity => {
        const persons = [...entity.persons];
        const index = persons.findIndex(p => p._id.toString() === currentAgentId);
        if (index === -1) {
          console.warn('Could not find person in entity. No changes', {
            entity,
            data,
            currentAgent,
          });
          return entity;
        }
        const person = persons[index];
        const contactRef = this.#getContactRef();
        if (!isContact(contactRef)) {
          console.warn('Could not find contact ref for person in entity. No changes', {
            entity,
            data,
            currentAgent,
          });
          return entity;
        }
        person.contact_references[entityId] = contactRef;
        const newPerson = new Person(person);
        newPerson.roles[entityId] = this.#getCurrentRoleSelection();
        persons[index] = newPerson;
        const clone = cloneEntity(entity);
        clone.persons = persons;
        return clone;
      });
    } else if (data.__kind === 'institution') {
      this.entity.update(entity => {
        const institutions = [...entity.institutions];
        const index = institutions.findIndex(i => i._id.toString() === currentAgentId);
        if (index === -1) {
          console.warn('Could not find institution in entity. No changes', {
            entity,
            data,
            currentAgent,
          });
          return entity;
        }
        const institution = institutions[index];
        const address = this.#getAddress();
        if (!isAddress(address)) {
          console.warn('Could not find address for institution in entity. No changes', {
            entity,
            data,
            currentAgent,
          });
          return entity;
        }
        institution.addresses[entityId] = address;
        institution.university = data.__kind === 'institution' ? data.university : '';

        const newInstitution = new Institution(institution);
        newInstitution.roles[entityId] = this.#getCurrentRoleSelection();
        institutions[index] = newInstitution;
        const clone = cloneEntity(entity);
        clone.institutions = institutions;
        return clone;
      });
    }
    this.resetAgentForm();
  }

  onEditAgent(field: PersonModelKeys | InstitutionModelKeys) {
    this.agentForm().value.update(v => {
      if (v.__kind === 'person' && field in v) {
        const hasValue = v.__editing.includes(field as PersonModelKeys);
        return {
          ...v,
          __editing: hasValue
            ? v.__editing.filter(f => f !== field)
            : v.__editing.concat(field as PersonModelKeys),
        };
      } else if (v.__kind === 'institution' && field in v) {
        const hasValue = v.__editing.includes(field as InstitutionModelKeys);
        return {
          ...v,
          __editing: hasValue
            ? v.__editing.filter(f => f !== field)
            : v.__editing.concat(field as InstitutionModelKeys),
        };
      }
      return { ...v };
    });
  }

  changeTab(event: MatTabChangeEvent) {
    this.selectedTabIndex.set(event.index);
    this.resetAgentForm();
  }

  resetAgentForm() {
    this.selectedAgent.set(null);
    this.agentForm().reset();
    this.agentForm().value.set(this.selectedTabIndex() === 0 ? emptyPerson() : emptyInstitution());
    this.clearRoleSelection();
  }

  clearRoleSelection() {
    this.roleForm().value.update(roles => roles.map(role => ({ ...role, checked: false })));
    // this.newCustomRoleForm().value.set({ checked: false, value: '' });
  }

  ngOnInit(): void {
    /*const fixedRoles = this.availableRoles().map(r => r.type);
    const allAgents = [...this.entity().persons, ...this.entity().institutions];

    for (const agent of allAgents) {
      for (const role of agent.roles?.[this.entityId()] ?? []) {
        if (!fixedRoles.includes(role)) {
          this.addRoleIfNotExists(role);
        }
      }
      }*/
  }
}
