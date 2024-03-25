import { Injectable } from '@angular/core';

import { ObjectId } from 'src/common';

@Injectable({
  providedIn: 'root',
})
export class UuidService {
  private __UUID = new ObjectId().toString();

  constructor() {}

  public reset() {
    this.__UUID = new ObjectId().toString();
  }

  get UUID() {
    return this.__UUID;
  }
}
