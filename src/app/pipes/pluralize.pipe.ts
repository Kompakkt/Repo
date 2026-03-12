import { Pipe, PipeTransform } from '@angular/core';
import pluralize from 'pluralize';

pluralize.addPluralRule('object', 'objects');
pluralize.addPluralRule('collection', 'collections');

@Pipe({ name: 'pluralize' })
export class PluralizePipe implements PipeTransform {
  transform(word: string, count: number): string {
    return pluralize(word, count);
  }
}
