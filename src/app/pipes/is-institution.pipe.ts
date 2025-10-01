import { Pipe, PipeTransform } from '@angular/core';
import { IInstitution, IPerson, isInstitution } from 'src/common';

@Pipe({
  name: 'isInstitution',
  standalone: true,
})
export class IsInstitutionPipe implements PipeTransform {
  transform(value: IPerson | IInstitution): value is IInstitution {
    return isInstitution(value);
  }
}
