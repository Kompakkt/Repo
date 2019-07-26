import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UuidService {

  public UUID: string;

  // Needed for ObjectId gen
  /* tslint:disable:no-magic-numbers */
  private genIndex = parseInt((Math.random() * 0xFFFFFF).toString(), 10);
  private MACHINE_ID = Math.floor(Math.random() * 0xFFFFFF);
  private pid = Math.floor(Math.random() * 100000) % 0xFFFF;
  /* tslint:enable:no-magic-numbers */

  constructor() {
    this.UUID = `${this.generateObjectId()}`;
  }

  public reset() {
    this.UUID = `${this.generateObjectId()}`;
  }

  // Generates ObjectId similar to MongoDB ObjectId
  public generateObjectId(): string {
    /* tslint:disable:no-magic-numbers */
    const next = () => {
      return this.genIndex = (this.genIndex + 1) % 0xFFFFFF;
    };

    const hex = (length, n) => {
      n = n.toString(16);
      return (n.length === length) ? n : '00000000'.substring(n.length, length) + n;
    };

    const time = parseInt((Date.now() / 1000).toString(), 10) % 0xFFFFFFFF;

    return hex(8, time) + hex(6, this.MACHINE_ID) + hex(4, this.pid) + hex(6, next());
    /* tslint:enable:no-magic-numbers */
  }

}
