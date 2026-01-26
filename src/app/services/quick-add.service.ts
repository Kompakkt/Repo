import { inject, Injectable } from '@angular/core';

import {
  Collection,
  ICompilation,
  IEntity,
  IUserData,
  areDocumentsEqual,
  isEntity,
} from 'src/common';
import { AccountService, BackendService } from './';
import { NotificationService } from '../components/notification-area/notification-area.component';

@Injectable({
  providedIn: 'root',
})
export class QuickAddService {
  #account = inject(AccountService);
  #backend = inject(BackendService);
  #notification = inject(NotificationService);

  public quickAddToCompilation = async ({ _id: compilationId }: ICompilation, _id: string) => {
    if (!_id || _id === '') {
      console.error('No object selected');
      return;
    }

    const entity = await this.#backend.getEntity(_id).catch(() => undefined);
    if (!entity) {
      this.#notification.showNotification({ type: 'warn', message: 'Failed fetching object!' });
      return;
    }

    try {
      const compilation = await this.#backend.getCompilation(compilationId);
      if (!compilation) throw new Error('Password protected compilation');

      if (Object.keys(compilation.entities).includes(_id)) {
        this.#notification.showNotification({
          type: 'warn',
          message: 'Object already in collection!',
        });
        return;
      }

      compilation.entities[_id] = entity;

      const result = await this.#backend.pushCompilation(compilation);

      this.#account.updateTrigger$.next(Collection.compilation);

      console.log('Updated compilation: ', result);
      this.#notification.showNotification({ type: 'info', message: 'Added object to collection!' });
    } catch (error) {
      console.error('Error updating compilation:', error);
    }
  };
}
