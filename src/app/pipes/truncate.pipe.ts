import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  standalone: true,
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, length: number, outputAsBoolean?: boolean): string | boolean {
    if (value.length < length) {
      return outputAsBoolean ? false : value;
    }
    const truncatedValue = value.slice(0, length) + '…';
    return outputAsBoolean ? true : truncatedValue;
  }
}
