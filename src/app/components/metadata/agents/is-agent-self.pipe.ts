import { inject, Pipe, PipeTransform } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { IPersonResolved } from '@kompakkt/common';
import { getMostRecentContactRef } from 'src/app/metadata';
import { AccountService } from 'src/app/services/account.service';

@Pipe({ name: 'isAgentSelf' })
export class IsAgentSelfPipe implements PipeTransform {
  #account = inject(AccountService);
  #user = toSignal(this.#account.user$);

  transform(value: IPersonResolved): boolean {
    const user = this.#user();
    if (!user) return false;
    return getMostRecentContactRef(value)?.mail === user.mail;
  }
}
