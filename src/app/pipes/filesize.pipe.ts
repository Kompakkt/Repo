import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filesize',
})
export class FilesizePipe implements PipeTransform {
  transform(value: number, ...args: unknown[]): string {
    const dataUnits = ['kB', 'MB', 'GB'];
    let dataUnitIndex = 0;
    value = value / 1e3; // byte to kilobyte
    if (value > 1e3) {
      // kilobyte to megabyte
      value = value / 1e3;
      dataUnitIndex++;
    }
    if (value > 1e3) {
      // megabyte to gigabyte
      value = value / 1e3;
      dataUnitIndex++;
    }
    return dataUnitIndex === 2
      ? `${value.toFixed(3)} ${dataUnits[dataUnitIndex]}`
      : `${value.toFixed(2)} ${dataUnits[dataUnitIndex]}`;
  }
}
