import { Pipe, PipeTransform } from '@angular/core';
import { ICompilation, IEntity, isEntity } from '@kompakkt/common';

@Pipe({
  name: 'isEntity',
  standalone: true,
})
export class IsEntityPipe implements PipeTransform {
  transform(value: IEntity | ICompilation): value is IEntity {
    return isEntity(value);
  }
}
