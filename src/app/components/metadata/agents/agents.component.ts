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
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { AgentListComponent } from './agent-list/agent-list.component';
import {
  IAddress,
  IContact,
  IInstitutionResolved,
  IPersonResolved,
  isAddress,
  isContact,
  isInstitution,
  isPerson,
} from '@kompakkt/common';
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
  minLength,
  required,
  validate,
} from '@angular/forms/signals';
import { createWrappedModel, UnwrappedModelKeys, WrappedModel } from '../metadata-util';
import {
  AnyEntity,
  emptyAddress,
  emptyContactRef,
  emptyInstitution,
  emptyPerson,
  getMostRecentAddress,
  getMostRecentContactRef,
} from 'src/app/metadata';
import { MostRecentAddressPipe } from 'src/app/pipes/most-recent-address.pipe';
import { PrettyPrintAddressPipe } from 'src/app/pipes/pretty-print-address.pipe';
import { MostRecentContactRefPipe } from 'src/app/pipes/most-recent-contact-ref.pipe';
import { PrettyPrintContactRefPipe } from 'src/app/pipes/pretty-print-contact-ref.pipe';
import { DEFAULT_ROLES, emptyRoleEntry, formatRoleLabel, RoleEntry } from './shared';
import { AccountService } from 'src/app/services/account.service';
import { BackendService } from 'src/app/services/backend.service';

const withoutProps = <T, K extends keyof T>(obj: T, ...props: K[]): Omit<T, K> => {
  const copy = { ...obj };
  for (const prop of props) {
    delete copy[prop];
  }
  return copy;
};

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
const emptyPersonModel = (): PersonModel =>
  createWrappedModel(
    {
      prename: '',
      surname: '',
      mail: '',
      phoneNumber: '',
    },
    'person',
  ) as PersonModel;

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
const emptyInstitutionModel = () =>
  createWrappedModel(
    {
      name: '',
      university: '',
      country: '',
      postal: '',
      city: '',
      street: '',
      number: '',
      building: '',
    },
    'institution',
  ) as InstitutionModel;

type AgentModel = PersonModel | InstitutionModel;
type PersonModelKeys = UnwrappedModelKeys<PersonModel>;
type InstitutionModelKeys = UnwrappedModelKeys<InstitutionModel>;

@Component({
  selector: 'app-agents',
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
    IsAgentInEntityPipe,
    IsAgentSelfPipe,
    IsDefaultRolePipe,
    OutlinedInputComponent,
    MostRecentAddressPipe,
    MostRecentContactRefPipe,
    PrettyPrintAddressPipe,
    PrettyPrintContactRefPipe,
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

  agentsModel = model<Array<IPersonResolved | IInstitutionResolved>>([]);
  agentsForm = form(this.agentsModel, path => {
    minLength(path, 1, { message: 'At least one agent is required' });
    validate(path, ({ value }) => {
      const agents = value();
      if (!agents.some(a => a.roles[this.entity()._id].includes('CONTACT_PERSON')))
        return {
          kind: 'required',
          message: 'At least one contact person is required',
        };
      if (!agents.some(a => a.roles[this.entity()._id].includes('RIGHTS_OWNER')))
        return {
          kind: 'required',
          message: 'At least one rights owner is required',
        };
      return undefined;
    });
  });
  _agentsFormChangedRef = effect(() => {
    const data = this.agentsForm().value();
    const persons = data.filter(a => isPerson(a));
    const institutions = data.filter(a => isInstitution(a));
    this.entity.update(entity => ({
      ...entity,
      persons,
      institutions,
    }));
  });

  currentAgentModel = model<AgentModel>(emptyPersonModel());
  currentAgentForm = form(this.currentAgentModel, path => {
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
  selectedKind = computed(() => this.currentAgentForm().value().__kind);
  personForm = computed(() => {
    const form = this.currentAgentForm;
    if (this.currentAgentForm().value().__kind !== 'person') return undefined;
    return form as FieldTree<PersonModel, string | number, 'writable'>;
  });
  institutionForm = computed(() => {
    const form = this.currentAgentForm;
    if (this.currentAgentForm().value().__kind !== 'institution') return undefined;
    return form as FieldTree<InstitutionModel, string | number, 'writable'>;
  });
  isPrefilled = computed(() => this.currentAgentForm().value().__prefilled);
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

  selectedAgent = signal<IPersonResolved | IInstitutionResolved | null>(null);

  #selfAsPerson = computed(() => {
    const user = this.account.user();
    if (!user) return null;
    const entityId = this.entityId();
    if (!entityId) return null;
    const selfAsPerson = {
      ...emptyPerson(),
      prename: user.prename,
      name: user.surname,
    } as IPersonResolved;
    selfAsPerson.contact_references[entityId] = {
      ...emptyContactRef(),
      mail: user.mail,
    };
    return selfAsPerson;
  });

  #personsResource = this.cache.cachedResource(
    () => 'metadata-agents-persons',
    () => this.backend.getUserDataPersons({ full: true }) as Promise<IPersonResolved[]>,
  );
  #mappedPersons = computed(() => {
    const persons = this.#personsResource.value() ?? [];
    // De-duplication of suggested persons based on their contact references
    const map = new Map<string, IPersonResolved>();
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
            [this.entityId()]: person.contact_references[this.entityId()] ?? {
              ...emptyContactRef(),
              mail: pair.mail,
              phonenumber: pair.phonenumber,
            },
          },
        });
      }
    }
    return Array.from(map.values()).map(p => ({
      ...emptyPerson(),
      ...p,
    }));
  });
  availablePersons = computed(() => {
    const persons = this.#mappedPersons();
    const self = this.#selfAsPerson();
    if (!self) return persons;
    if (persons.find(p => getMostRecentContactRef(p)?.mail === getMostRecentContactRef(self)?.mail))
      return persons;
    // Prepend self as option
    return [self, ...persons];
  });

  #institutionsResource = this.cache.cachedResource(
    () => 'metadata-agents-institutions',
    () => this.backend.getUserDataInstitutions({ full: true }) as Promise<IInstitutionResolved[]>,
  );
  #mappedInstitutions = computed(() => {
    const institutions = this.#institutionsResource.value() ?? [];
    // De-duplication of suggested institutions based on their addresses
    const map = new Map<string, IInstitutionResolved>();
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
            [this.entityId()]: institution.addresses[this.entityId()] ?? {
              ...emptyAddress(),
              building: pair.building,
              number: pair.number,
              street: pair.street,
              postcode: pair.postcode,
              city: pair.city,
              country: pair.country,
            },
          },
        });
      }
    }
    return Array.from(map.values()).map(i => ({
      ...emptyInstitution(),
      ...i,
    }));
  });
  availableInstitutions = computed(() => this.#mappedInstitutions());

  #tagsResource = this.cache.cachedResource(
    () => 'metadata-agents-tags',
    () => this.backend.getUserDataTags({}),
  );
  availableTags = computed(() => this.#tagsResource.value() ?? []);

  filteredPersons = computed(() => {
    const data = this.currentAgentForm().value();
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
    const data = this.currentAgentForm().value();
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
        if (role.type.startsWith('EMPTY_CUSTOM-')) return formatRoleLabel(role.value.trim());
        return role.type;
      });
  }

  #getAddress(): IAddress | undefined {
    const data = this.currentAgentForm().value();
    if (data.__kind !== 'institution') return undefined;
    return { ...emptyAddress(), ...data };
  }

  #getContactRef(): IContact | undefined {
    const data = this.currentAgentForm().value();
    if (data.__kind !== 'person') return undefined;
    return { ...emptyContactRef(), ...data };
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

  setAgentInForm(agent: IPersonResolved | IInstitutionResolved, clearRoles: boolean) {
    if (isPerson(agent)) {
      this.selectedTabIndex.set(0);
    } else if (isInstitution(agent)) {
      this.selectedTabIndex.set(1);
    }

    this.currentAgentForm().value.update(v => {
      if (v.__kind === 'person' && 'prename' in agent) {
        const mostRecentContactRef = getMostRecentContactRef(agent);
        if (mostRecentContactRef) {
          return {
            ...v,
            prename: agent.prename,
            surname: agent.name,
            mail: mostRecentContactRef.mail,
            phoneNumber: mostRecentContactRef.phonenumber,
            __prefilled: true,
          };
        }
      } else if (v.__kind === 'institution' && 'university' in agent) {
        const mostRecentAdress = getMostRecentAddress(agent);
        if (mostRecentAdress) {
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
    const data = this.currentAgentForm().value();
    const entityId = this.entityId();
    const roles = this.#getCurrentRoleSelection();
    if (data.__kind === 'person') {
      const contactRef = this.#getContactRef();
      if (!contactRef) return;
      const personInstance: IPersonResolved = {
        ...emptyPerson(),
        prename: data.prename,
        name: data.surname,
      };
      personInstance.contact_references[entityId] = contactRef;
      personInstance.roles[entityId] = roles;
      this.agentsForm().value.update(arr => [...arr, personInstance]);
    } else if (data.__kind === 'institution') {
      const address = this.#getAddress();
      if (!address) return;
      const institutionInstance: IInstitutionResolved = {
        ...emptyInstitution(),
        name: data.name,
      };
      institutionInstance.addresses[entityId] = address;
      institutionInstance.roles[entityId] = roles;
      this.agentsForm().value.update(arr => [...arr, institutionInstance]);
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
    const cleanedUpRoleName = formatRoleLabel(newRoleName);
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
    const data = this.currentAgentForm().value();
    const entityId = this.entityId();

    if (data.__kind === 'person') {
      this.agentsForm().value.update(arr => {
        const persons = [...arr];
        const index = persons.findIndex(p => p._id.toString() === currentAgentId);
        if (index === -1) {
          console.warn('Could not find person in entity. No changes', {
            data,
            currentAgent,
          });
          return persons;
        }
        const person = persons[index];
        const contactRef = this.#getContactRef();
        if (!isPerson(person)) {
          console.warn('Agent is not a person. No changes', {
            data,
            currentAgent,
          });
          return persons;
        }
        if (!isContact(contactRef)) {
          console.warn('Could not find contact ref for person in entity. No changes', {
            data,
            currentAgent,
          });
          return persons;
        }
        person.contact_references[entityId] = contactRef;
        const newPerson: IPersonResolved = { ...emptyPerson(), ...person };
        newPerson.roles[entityId] = this.#getCurrentRoleSelection();
        persons[index] = newPerson;
        return persons;
      });
    } else if (data.__kind === 'institution') {
      this.agentsForm().value.update(arr => {
        const institutions = [...arr];
        const index = institutions.findIndex(i => i._id.toString() === currentAgentId);
        if (index === -1) {
          console.warn('Could not find institution in entity. No changes', {
            data,
            currentAgent,
          });
          return institutions;
        }
        const institution = institutions[index];
        if (!isInstitution(institution)) {
          console.warn('Agent is not an institution. No changes', {
            data,
            currentAgent,
          });
          return institutions;
        }
        const address = this.#getAddress();
        if (!isAddress(address)) {
          console.warn('Could not find address for institution in entity. No changes', {
            data,
            currentAgent,
          });
          return institutions;
        }
        institution.addresses[entityId] = address;
        institution.university = data.__kind === 'institution' ? data.university : '';

        const newInstitution: IInstitutionResolved = { ...emptyInstitution(), ...institution };
        newInstitution.roles[entityId] = this.#getCurrentRoleSelection();
        institutions[index] = newInstitution;
        return institutions;
      });
    }
    this.resetAgentForm();
  }

  onEditAgent(field: PersonModelKeys | InstitutionModelKeys) {
    this.currentAgentForm().value.update(v => {
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
    this.currentAgentForm().reset();
    this.currentAgentForm().value.set(
      this.selectedTabIndex() === 0 ? emptyPersonModel() : emptyInstitutionModel(),
    );
    this.clearRoleSelection();
  }

  clearRoleSelection() {
    this.roleForm().value.update(roles => roles.map(role => ({ ...role, checked: false })));
    // this.newCustomRoleForm().value.set({ checked: false, value: '' });
  }

  ngOnInit(): void {
    const allAgents = [...this.entity().persons, ...this.entity().institutions];
    this.agentsModel.update(() => allAgents);
    /*
    TODO: Re-enable
    const fixedRoles = this.availableRoles().map(r => r.type);


    for (const agent of allAgents) {
      for (const role of agent.roles?.[this.entityId()] ?? []) {
        if (!fixedRoles.includes(role)) {
          this.addRoleIfNotExists(role);
        }
      }
      }*/
  }
}
