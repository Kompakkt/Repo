import { Pipe, PipeTransform } from '@angular/core';
import { IInstitution, isAddress } from 'src/common';

@Pipe({ name: 'getInstitutionAddress' })
export class GetInstitutionAddressPipe implements PipeTransform {
  transform(value: IInstitution, entityId: string) {
    const address = value.addresses[entityId];
    if (isAddress(address)) return address;
    return undefined;
  }
}
