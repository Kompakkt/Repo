import { Pipe, PipeTransform } from '@angular/core';
import { ICompilation, IEntity, isCompilation } from 'src/common';

@Pipe({
  name: 'isCompilation',
  standalone: true,
})
export class IsCompilationPipe implements PipeTransform {
  transform(value: IEntity | ICompilation): value is IEntity {
    return isCompilation(value);
  }
}
