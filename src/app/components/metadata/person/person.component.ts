import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import { MatSelect, MatSelectChange, MatSelectTrigger } from '@angular/material/select';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { AsyncPipe } from '@angular/common';
import { MatIconButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatOption } from '@angular/material/core';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelDescription,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatTooltip } from '@angular/material/tooltip';
import { ContactReference, Institution, Person } from 'src/app/metadata';
import { ContentProviderService } from 'src/app/services';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { metadataRolesAsOptions } from 'src/app/metadata/roles';

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.scss'],
  imports: [
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatIcon,
    MatTooltip,
    MatExpansionPanelDescription,
    MatFormField,
    MatLabel,
    MatInput,
    FormsModule,
    MatCheckbox,
    MatSelect,
    MatSelectTrigger,
    MatOption,
    MatIconButton,
    MatAutocompleteTrigger,
    ReactiveFormsModule,
    MatAutocomplete,
    AsyncPipe,
    TranslatePipe,
  ],
})
export class PersonComponent implements OnChanges {
  @Input() public entityId!: string;
  @Input() public person!: Person;

  private isExisting = new BehaviorSubject(false);
  private anyRoleSelected = new BehaviorSubject(false);
  private availableContacts = new BehaviorSubject<ContactReference[]>([]);
  private selectedContact = new BehaviorSubject<ContactReference | undefined>(undefined);

  public availableRoles = metadataRolesAsOptions();

  public availableInstitutions = new BehaviorSubject<Institution[]>([]);
  public searchInstitution = new FormControl('');
  public filteredInstitutions$: Observable<Institution[]>;

  public Institution = Institution;

  constructor(private content: ContentProviderService) {
    this.content.$Institutions.subscribe(insts => {
      this.availableInstitutions.next(insts.map(i => new Institution(i)));
    });

    this.filteredInstitutions$ = this.searchInstitution.valueChanges.pipe(
      startWith(''),
      map(value => (value as string).toLowerCase()),
      map(value =>
        this.availableInstitutions.value.filter(i => i.name.toLowerCase().includes(value)),
      ),
    );
  }

  public async selectInstitution(event: MatAutocompleteSelectedEvent) {
    const institutionId = event.option.value;
    const institution = this.availableInstitutions.value.find(i => i._id === institutionId);
    if (!institution) return console.warn(`Could not find institution with id ${institutionId}`);
    this.person.addInstitution(institution, this.entityId);
  }

  public addInstitution(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.person.addInstitution(new Institution(), this.entityId);
  }

  public removeInstitution(index: number) {
    Array.isArray(this.person.institutions[this.entityId])
      ? this.person.institutions[this.entityId]?.splice(index, 1)
      : console.warn(`Could not remove isntitution at ${index} from ${this.person}`);
  }

  public displayInstitutionName(institution: Institution): string {
    return institution.name;
  }

  get availableContacts$() {
    return this.availableContacts.asObservable();
  }

  get selectedContact$() {
    return this.selectedContact.asObservable();
  }

  get isExisting$() {
    return this.isExisting.asObservable();
  }

  get anyRoleSelected$() {
    return this.anyRoleSelected.asObservable();
  }

  get generalInformationValid() {
    return this.person.fullName.length > 0;
  }

  get contactValid() {
    return ContactReference.checkIsValid(
      this.person.contact_references[this.entityId] ?? new ContactReference(),
    );
  }

  public selectContact(event: MatSelectChange) {
    const contact =
      event.value === 'empty'
        ? new ContactReference()
        : this.availableContacts.value.find(contact => contact._id === event.value);
    if (!contact) return console.warn('No contact found');
    this.person.setContactRef(contact, this.entityId);
    this.selectedContact.next(contact);
  }

  public updateRoles() {
    this.anyRoleSelected.next(!!this.availableRoles.find(role => role.checked));
    this.person.setRoles(
      this.availableRoles.filter(role => role.checked).map(role => role.type),
      this.entityId,
    );
  }

  get availableInstitutions$() {
    return this.content.$Institutions;
  }

  ngOnChanges(changes: SimpleChanges) {
    const person = changes.person?.currentValue as Person | undefined;
    if (person) {
      this.isExisting.next(person.fullName.trim().length > 0);

      // Patch existing roles into role object
      for (const role of this.person.roles[this.entityId] ?? []) {
        for (const roleOption of this.availableRoles) {
          if (roleOption.type === role) roleOption.checked = true;
        }
      }
      this.updateRoles();

      // Patch existing addresses to address selection and input
      this.availableContacts.next(Person.getValidContactRefs(person));

      const mostRecentContact = Person.getMostRecentContactRef(person);
      this.person.setContactRef(mostRecentContact, this.entityId);
      this.selectedContact.next(mostRecentContact);

      // Patch existing related institutions
    }
  }
}
