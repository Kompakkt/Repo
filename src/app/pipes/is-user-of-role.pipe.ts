import { Pipe } from '@angular/core';
import { ICompilation, IEntity, IUserData, IUserDataWithoutData } from 'src/common/interfaces';

@Pipe({
  name: 'isUserOfRole',
  standalone: true,
})
export class IsUserOfRolePipe {
  transform(
    item: IEntity | ICompilation,
    role: string,
    userData: IUserData | IUserDataWithoutData | undefined,
  ): boolean {
    if (!item.access || !userData) return false;
    const userAccess = item.access[userData._id];
    return userAccess && userAccess.role === role;
  }
}
