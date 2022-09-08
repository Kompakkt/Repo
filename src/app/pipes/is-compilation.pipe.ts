import { Pipe, PipeTransform } from '@angular/core';
import { isCompilation } from '~common/typeguards';

@Pipe({
  name: 'isCompilation',
})
export class IsCompilationPipe implements PipeTransform {
  transform(value: unknown) {
    return isCompilation(value);
  }
}
