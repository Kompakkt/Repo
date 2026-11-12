import { Pipe, PipeTransform } from '@angular/core';
import { IAddress } from '@kompakkt/common';
import { formatAddress } from '../metadata';

@Pipe({ name: 'prettyPrintAddress' })
export class PrettyPrintAddressPipe implements PipeTransform {
  transform(value: IAddress): string {
    return formatAddress(value);
  }
}
