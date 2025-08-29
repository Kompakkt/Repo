import { Pipe, PipeTransform } from '@angular/core';
import { ICompilation } from 'src/@kompakkt/plugins/extender/src/common';
import { IEntity } from 'src/@kompakkt/plugins/plugins/semantic-kompakkt-metadata/src/common';
import { IGroup, isGroup } from 'src/common';

@Pipe({
  name: 'isGroup',
  standalone: true,
})
export class IsGroupPipe implements PipeTransform {
  transform(value: IGroup | ICompilation | IEntity): value is IGroup {
    return isGroup(value);
  }
}
