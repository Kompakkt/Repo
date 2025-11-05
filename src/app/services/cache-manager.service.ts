import { Injectable } from '@angular/core';
import equal from 'fast-deep-equal';
import { openDB, type IDBPDatabase } from 'idb';
import { concat, distinctUntilChanged, filter, from, of, switchMap, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CacheManagerService {
  #dbPromise: Promise<IDBPDatabase<unknown>> = openDB('kompakkt-cache', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('items')) {
        db.createObjectStore('items', { keyPath: 'key' });
      }
    },
  });

  /*async addItem<T>(key: string, value: T): Promise<IDBValidKey> {
    const db = await this.#dbPromise;
    return db.put('items', { key, value });
  }*/
  getItem<T>(key: string, retrievalPromise?: () => Promise<T | undefined>) {
    const cachedItem$ = from(this.#dbPromise).pipe(
      switchMap(db => from(db.get('items', key))),
      filter(record => record?.value !== undefined),
      switchMap(record => of(record.value as T)),
      tap(item => console.debug('Cache hit for key:', key, 'Item:', item)),
    );

    const freshItem$ = from(retrievalPromise ? retrievalPromise() : of(undefined)).pipe(
      filter(item => item !== undefined),
      switchMap(item =>
        from(this.#dbPromise).pipe(
          switchMap(db => from(db.put('items', { key, value: item }))),
          tap(() => console.debug('Cache updated for key:', key, 'Item:', item)),
          switchMap(() => of(item as T)),
        ),
      ),
    );

    // Emit cached item first (if exists), then fresh item (if exists)
    return concat(cachedItem$, freshItem$).pipe(
      distinctUntilChanged((prev, curr) => equal(prev, curr)),
    );
  }
}
