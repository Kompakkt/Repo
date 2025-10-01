import { Pipe, PipeTransform } from '@angular/core';
import { IPerson, isContact } from 'src/common';

@Pipe({ name: 'getPersonContactReference' })
export class GetPersonContactReferencePipe implements PipeTransform {
  transform(value: IPerson, entityId: string) {
    const contactRef = value.contact_references[entityId];
    if (isContact(contactRef)) return contactRef;
    return undefined;
  }
}
