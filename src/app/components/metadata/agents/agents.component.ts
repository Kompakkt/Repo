import { Component, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { TranslatePipe } from '../../../pipes/translate.pipe';
import { ContactReference, Institution, Person } from 'src/app/metadata';

import { BehaviorSubject } from 'rxjs';

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
  @Input() agent?: any;
  @Input() entityId!: string;

  public prenameControl = new FormControl('');
  public nameControl = new FormControl('');
  public mailControl = new FormControl('');

  public countryControl = new FormControl('');
  public postalControl = new FormControl('');
  public cityControl = new FormControl('');
  public streetControl = new FormControl('');
  public numberControl = new FormControl('');
  public buildingControl = new FormControl('');

  public personSelected: boolean = false;
  public institutionSelected: boolean = false;

  private anyRoleSelected = new BehaviorSubject(false);
  private availableContacts = new BehaviorSubject<ContactReference[]>([]);
  private isExisting = new BehaviorSubject(false);
  private selectedContact = new BehaviorSubject<ContactReference | undefined>(undefined);

  public availableRoles = [
    { type: 'RIGHTS_OWNER', value: 'Rightsowner', checked: false },
    { type: 'CREATOR', value: 'Creator', checked: false },
    { type: 'EDITOR', value: 'Editor', checked: false },
    { type: 'DATA_CREATOR', value: 'Data Creator', checked: false },
    { type: 'CONTACT_PERSON', value: 'Contact Person', checked: false },
  ];

  get anyRoleSelected$() {
    return this.anyRoleSelected.asObservable();
  }

  public updateRoles() {
    this.anyRoleSelected.next(!!this.availableRoles.find(role => role.checked));
    this.agent.setRoles(
      this.availableRoles.filter(role => role.checked).map(role => role.type),
      this.entityId,
    );
  }

  public updateFormFields(agent) {
    this.prenameControl.setValue(agent.prename || '');
    this.nameControl.setValue(agent.name || '');
    this.mailControl.setValue(agent.contact_references?.[this.entityId]?.mail || '');
    this.personSelected = true;
  }

  changeAgent(changedOption: string) {
    if (changedOption === 'person') {
      this.institutionSelected = !this.personSelected;
    } else if (changedOption === 'institution') {
      this.personSelected = !this.institutionSelected;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    const currentAgent = changes.agent?.currentValue as Person | undefined;
    if (currentAgent) {
      this.isExisting.next(currentAgent.fullName.trim().length > 0);

      for (const role of this.agent.roles[this.entityId] ?? []) {
        for (const roleOption of this.availableRoles) {
          if (roleOption.type === role) roleOption.checked = true;
        }
      }
      this.updateRoles();

      this.availableContacts.next(Person.getValidContactRefs(currentAgent));

      const mostRecentContact = Person.getMostRecentContactRef(currentAgent);
      this.agent.setContactRef(mostRecentContact, this.entityId);
      this.selectedContact.next(mostRecentContact);

      this.updateFormFields(currentAgent);
    }
  }
}
