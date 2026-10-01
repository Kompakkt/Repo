import { Component, computed, input } from '@angular/core';

import { IAddress, IInstitution, isAddress } from '@kompakkt/common';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-detail-institution',
  templateUrl: './detail-institution.component.html',
  styleUrls: ['./detail-institution.component.scss'],
  imports: [TranslatePipe, MatMenuModule],
})
export class DetailInstitutionComponent {
  institution = input.required<IInstitution>();

  roles = computed(() => {
    const roles = this.institution().roles;
    const firstRoleArr = Object.values(roles).find(
      (value): value is string[] => Array.isArray(value) && value.length > 0,
    );
    return firstRoleArr?.map(role => role.split('_').join(' ').toLowerCase());
  });

  address = computed(() => {
    const references = this.institution().addresses;
    const firstContactRef = Object.values(references).find((value): value is IAddress =>
      isAddress(value),
    );
    return firstContactRef;
  });

  imageUrl = computed(() => {
    return '/assets/kompakkt-logo-cube.svg';
  });
}
