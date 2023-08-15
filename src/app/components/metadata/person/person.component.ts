import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatSelectChange } from '@angular/material/select';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { ContentProviderService } from 'src/app/services';
import { Person, ContactReference, Institution } from '~metadata';
import { TranslateService } from './../../../services/translate/translate.service';

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.scss'],
})
export class PersonComponent implements OnChanges {
  translateItems: string[] = [];
  @Input() public entityId!: string;
  @Input() public person!: Person;

  private isExisting = new BehaviorSubject(false);
  private anyRoleSelected = new BehaviorSubject(false);
  private availableContacts = new BehaviorSubject<ContactReference[]>([]);
  private selectedContact = new BehaviorSubject<ContactReference | undefined>(undefined);

  public availableRoles = [
    { type: 'RIGHTS_OWNER', value: 'Rightsowner', checked: false },
    { type: 'CREATOR', value: 'Creator', checked: false },
    { type: 'EDITOR', value: 'Editor', checked: false },
    { type: 'DATA_CREATOR', value: 'Data Creator', checked: false },
    { type: 'CONTACT_PERSON', value: 'Contact Person', checked: false },
  ];

  public availableInstitutions = new BehaviorSubject<Institution[]>([]);
  public searchInstitution = new FormControl('');
  public filteredInstitutions$: Observable<Institution[]>;

  public Institution = Institution;

  constructor(private translate: TranslateService, private content: ContentProviderService) {
    this.translate.use(window.navigator.language.split('-')[0]);
    this.translateStrings();
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

  async translateStrings() {
    const translateSet = ['New Person'];
    this.translateItems = await this.translate.loadFromFile(translateSet);
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
