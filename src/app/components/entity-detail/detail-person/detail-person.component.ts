import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { IContact, IInstitution, IPerson, isContact, isInstitution } from 'src/common';
import { DetailInstitutionComponent } from '../detail-institution/detail-institution.component';

@Component({
  selector: 'app-detail-person',
  templateUrl: './detail-person.component.html',
  styleUrls: ['./detail-person.component.scss'],
  imports: [CommonModule, DetailInstitutionComponent],
})
export class DetailPersonComponent {
  person = input.required<IPerson>();
  contactRef = computed(() => {
    const references = this.person().contact_references;
    const firstContactRef = Object.values(references).find((value): value is IContact =>
      isContact(value),
    );
    return firstContactRef;
  });

  roles = computed(() => {
    const roles = this.person().roles;
    const firstRoleArr = Object.values(roles).find(
      (value): value is string[] => Array.isArray(value) && value.length > 0,
    );
    return firstRoleArr?.map(role => role.split('_').join(' ').toLowerCase());
  });

  institutions = computed(() => {
    const institutions = this.person().institutions;
    const firstInstitutionArr = Object.values(institutions).find(
      (value): value is IInstitution[] =>
        Array.isArray(value) && value.length > 0 && value.every(inst => isInstitution(inst)),
    );
    return firstInstitutionArr;
  });
}
