import { Pipe, PipeTransform } from '@angular/core';
import { ICompilation, IEntity, IGroup, isGroup } from 'src/common';

@Pipe({
  name: 'isGroup',
  standalone: true,
})
export class IsGroupPipe implements PipeTransform {
  transform(value: IGroup | ICompilation | IEntity): value is IGroup {
    return isGroup(value);
  }
}
