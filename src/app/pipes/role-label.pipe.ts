import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'roleLabel', standalone: true })
export class RoleLabelPipe implements PipeTransform {
  transform(role: string): string {
    return role
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase());
  }
}
