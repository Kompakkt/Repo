import { Injectable } from '@angular/core';
import ObjectID from 'bson-objectid';

@Injectable({
  providedIn: 'root',
})
export class UuidService {
  private __UUID = new ObjectID().toString();

  constructor() {}

  public reset() {
    this.__UUID = new ObjectID().toString();
  }

  get UUID() {
    return this.__UUID;
  }
}
