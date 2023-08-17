import { Pipe, PipeTransform } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Pipe({
  name: 'replayHasValue',
})
export class ReplayHasValuePipe implements PipeTransform {
  transform(value: ReplaySubject<any>): Observable<boolean> {
    return value.pipe(
      startWith(false),
      map(value => !!value),
    );
  }
}
