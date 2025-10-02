import { Pipe, PipeTransform } from '@angular/core';
import { getServerUrl } from '../util/get-server-url';

@Pipe({ name: 'getServerUrl' })
export class GetServerUrlPipe implements PipeTransform {
  transform(path: string): string {
    return getServerUrl(path);
  }
}
