import { Pipe } from '@angular/core';
import {
  ICompilation,
  IEntity,
  IUserData,
  IUserDataWithoutData,
} from '@kompakkt/common/interfaces';

@Pipe({
  name: 'isUserOfRole',
  standalone: true,
})
export class IsUserOfRolePipe {
  transform(
    item: IEntity | ICompilation,
    roles: string | string[],
    userData: IUserData | IUserDataWithoutData | undefined,
  ): boolean {
    if (!item.access || !userData) return false;
    const userAccess = item.access.find(user => user._id === userData._id);
    if (!userAccess) return false;
    if (typeof roles === 'string') {
      return userAccess.role === roles;
    } else {
      return roles.includes(userAccess?.role);
    }
  }
}
