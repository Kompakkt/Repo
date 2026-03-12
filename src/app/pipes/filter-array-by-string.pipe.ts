import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'filterArrayByString' })
export class FilterArrayByStringPipe implements PipeTransform {
  transform<T extends object>(value: T[], searchText: string, property: string): T[] {
    const cleanedText = searchText.trim().toLowerCase();
    if (cleanedText.length === 0) return value;
    return value.filter(item => {
      if (property && property in item) {
        const propValue = (item as any)[property];
        if (typeof propValue === 'string' || typeof propValue === 'number') {
          return propValue.toString().toLowerCase().includes(cleanedText);
        } else {
          console.warn(`Property '${property}' is not a string or number on item:`, item);
          return false;
        }
      }
      return Object.values(item)
        .map(v => v?.toString())
        .join(' ')
        .toLowerCase()
        .includes(cleanedText);
    });
  }
}
