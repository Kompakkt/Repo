import { Pipe, PipeTransform } from '@angular/core';
import { IInstitution, IPerson } from 'src/common';

@Pipe({
  name: 'getPersonOrInstitutionRoles',
})
export class GetPersonOrInstitutionRolesPipe implements PipeTransform {
  transform(value: IPerson | IInstitution, entityId: string) {
    return (
      value.roles[entityId]?.sort((a, b) => {
        // RIGHTS_OWNER and CONTACT_PERSON come first
        if (a === 'RIGHTS_OWNER') return -1;
        if (b === 'RIGHTS_OWNER') return 1;
        if (a === 'CONTACT_PERSON') return -1;
        if (b === 'CONTACT_PERSON') return 1;
        return a.localeCompare(b);
      }) ?? []
    );
  }
}
