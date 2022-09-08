import { Pipe, PipeTransform } from '@angular/core';
import { isEntity } from '~common/typeguards';

@Pipe({
  name: 'isEntity',
})
export class IsEntityPipe implements PipeTransform {
  transform(value: unknown) {
    return isEntity(value);
  }
}
