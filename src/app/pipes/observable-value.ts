import { Pipe, PipeTransform } from '@angular/core';
import { map, Observable } from 'rxjs';

@Pipe({
  name: 'observableValue',
  standalone: true,
})
export class ObservableValuePipe implements PipeTransform {
  transform<T>(value: Observable<T>): Observable<{ value: T }> {
    return value.pipe(map(value => ({ value })));
  }
}
