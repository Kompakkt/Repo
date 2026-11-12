import { Pipe, PipeTransform } from '@angular/core';
import { IAddress, IInstitutionResolved, IPersonResolved } from '@kompakkt/common';
import { getMostRecentAddress } from '../metadata';

@Pipe({ name: 'mostRecentAddress' })
export class MostRecentAddressPipe implements PipeTransform {
  transform(agent: IPersonResolved | IInstitutionResolved): IAddress | undefined {
    return 'addresses' in agent ? getMostRecentAddress(agent) : undefined;
  }
}
