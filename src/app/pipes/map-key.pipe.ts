import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'mapKey',
    pure: false,
    standalone: true,
})

export class MapKeyPipe implements PipeTransform {

    transform(key: string, propertyType: string): string {
        if (key === 'value') {
            const urlTypes = new Set(['biblio', 'link']);
            return urlTypes.has(propertyType) ? 'Url' : key;
          }
    
          return key;
    }
}