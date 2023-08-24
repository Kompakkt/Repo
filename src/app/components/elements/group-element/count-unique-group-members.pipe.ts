import { Pipe, PipeTransform } from '@angular/core';
import { IGroup } from '~common/interfaces';

@Pipe({
  name: 'countUniqueGroupMembers',
})
export class CountUniqueGroupMembersPipe implements PipeTransform {
  transform({ members, owners }: IGroup): unknown {
    const uniqueIds = new Set([...members, ...owners].map(({ _id }) => _id));
    return Array.from(uniqueIds).length;
  }
}
