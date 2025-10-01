import { Pipe, PipeTransform } from '@angular/core';
import { IGroup } from 'src/common';
import { ICompilation, IEntity, isCompilation } from 'src/common';

@Pipe({
  name: 'isCompilation',
  standalone: true,
})
export class IsCompilationPipe implements PipeTransform {
  transform(value: IEntity | ICompilation | IGroup): value is ICompilation {
    return isCompilation(value);
  }
}
