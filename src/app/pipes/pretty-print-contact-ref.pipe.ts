import { Pipe, PipeTransform } from '@angular/core';
import { formatContactRef } from '../metadata';
import { IContact } from '@kompakkt/common';

@Pipe({ name: 'prettyPrintContactRef' })
export class PrettyPrintContactRefPipe implements PipeTransform {
  transform(value: IContact): string {
    return formatContactRef(value);
  }
}
