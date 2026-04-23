import { inject, Pipe, PipeTransform } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Person } from 'src/app/metadata';
import { AccountService } from 'src/app/services';

@Pipe({ name: 'isAgentSelf' })
export class IsAgentSelfPipe implements PipeTransform {
  #account = inject(AccountService);
  #user = toSignal(this.#account.user$);

  transform(value: Person): boolean {
    const user = this.#user();
    if (!user) return false;
    return value.mostRecentContactRef?.mail === user.mail;
  }
}
