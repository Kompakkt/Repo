import { Pipe, PipeTransform } from '@angular/core';
import { IGroup } from 'src/@kompakkt/plugins/extender/src/common';
import { ICompilation, IEntity, isEntity } from 'src/common';

@Pipe({
  name: 'isEntity',
  standalone: true,
})
export class IsEntityPipe implements PipeTransform {
  transform(value: IEntity | ICompilation | IGroup): value is IEntity {
    return isEntity(value);
  }
}
