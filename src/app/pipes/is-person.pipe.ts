import { Pipe, PipeTransform } from '@angular/core';
import { IInstitution, IPerson, isPerson } from '@kompakkt/common';

@Pipe({
  name: 'isPerson',
  standalone: true,
})
export class IsPersonPipe implements PipeTransform {
  transform(value: IPerson | IInstitution): value is IPerson {
    return isPerson(value);
  }
}
