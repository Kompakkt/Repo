import { Pipe, PipeTransform } from '@angular/core';
import { IContact, IPersonResolved } from '@kompakkt/common';
import { getMostRecentContactRef } from '../metadata';

@Pipe({ name: 'mostRecentContactRef' })
export class MostRecentContactRefPipe implements PipeTransform {
  transform(agent: IPersonResolved): IContact | undefined {
    return getMostRecentContactRef(agent);
  }
}
