import { Pipe, PipeTransform } from '@angular/core';
import { IInstitution, IPerson, isInstitution } from '@kompakkt/common';

@Pipe({ name: 'isInstitution' })
export class IsInstitutionPipe implements PipeTransform {
  transform(value: IPerson | IInstitution): value is IInstitution {
    return isInstitution(value);
  }
}
