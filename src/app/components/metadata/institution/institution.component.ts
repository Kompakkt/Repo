import { AsyncPipe } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { MatSelect, MatSelectChange, MatSelectTrigger } from '@angular/material/select';
import { MatTooltip } from '@angular/material/tooltip';
import { BehaviorSubject } from 'rxjs';
import { Address, Institution } from 'src/app/metadata';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { AddressComponent } from '../address/address.component';

@Component({
  selector: 'app-institution',
  templateUrl: './institution.component.html',
  styleUrls: ['./institution.component.scss'],
  standalone: true,
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
    AddressComponent,
    AsyncPipe,
    TranslatePipe,
  ],
})
export class InstitutionComponent implements OnChanges {
  @Input() public entityId!: string;
  @Input() public institution!: Institution;

  private isExisting = new BehaviorSubject(false);
  private anyRoleSelected = new BehaviorSubject(false);
  private availableAddresses = new BehaviorSubject<Address[]>([]);
  private selectedAddress = new BehaviorSubject<Address | undefined>(undefined);

  constructor() {}

  public availableRoles = [
    { type: 'RIGHTS_OWNER', value: 'Rights Owner', checked: false },
    { type: 'CREATOR', value: 'Creator', checked: false },
    { type: 'EDITOR', value: 'Editor', checked: false },
    { type: 'DATA_CREATOR', value: 'Data Creator', checked: false },
    { type: 'CONTACT_PERSON', value: 'Contact Person', checked: false },
  ];

  get availableAddresses$() {
    return this.availableAddresses.asObservable();
  }

  get selectedAddress$() {
    return this.selectedAddress.asObservable();
  }

  get isExisting$() {
    return this.isExisting.asObservable();
  }

  get anyRoleSelected$() {
    return this.anyRoleSelected.asObservable();
  }

  get generalInformationValid() {
    return this.institution.name.length > 0;
  }

  get addressValid() {
    return Address.checkIsValid(this.institution.addresses[this.entityId] ?? new Address());
  }

  public selectAddress(event: MatSelectChange) {
    const address =
      event.value === 'empty'
        ? new Address()
        : this.availableAddresses.value.find(addr => addr._id === event.value);
    if (!address) return console.warn('No address found');
    this.institution.setAddress(address, this.entityId);
    this.selectedAddress.next(address);
  }

  public updateRoles() {
    this.anyRoleSelected.next(!!this.availableRoles.find(role => role.checked));
    this.institution.setRoles(
      this.availableRoles.filter(role => role.checked).map(role => role.type),
      this.entityId,
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    const institution = changes.institution?.currentValue as Institution | undefined;
    if (institution) {
      this.isExisting.next(institution.name.length > 0);

      // Patch existing roles into role object
      for (const role of this.institution.roles[this.entityId] ?? []) {
        for (const roleOption of this.availableRoles) {
          if (roleOption.type === role) roleOption.checked = true;
        }
      }
      this.updateRoles();

      // Patch existing addresses to address selection and input
      this.availableAddresses.next(Institution.getValidAddresses(institution));

      const mostRecentAddress = Institution.getMostRecentAddress(institution);
      this.institution.setAddress(mostRecentAddress, this.entityId);
      this.selectedAddress.next(mostRecentAddress);
    }
  }
}
