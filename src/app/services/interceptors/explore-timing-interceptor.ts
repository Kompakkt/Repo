import { HttpEvent, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ICompilation, IEntity } from 'src/common';

const isEventWithExploreBody = (
  event: HttpEvent<unknown>,
): event is HttpResponse<{
  requestTime: number;
  results: Array<IEntity | ICompilation>;
  suggestions: string[];
}> => {
  return (
    event instanceof HttpResponse &&
    'body' in event &&
    typeof event.body === 'object' &&
    event.body !== null &&
    'results' in event.body &&
    'suggestions' in event.body
  );
};

export const exploreTimingInterceptor = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  return next(req).pipe(
    map(event => {
      if (!req.url.endsWith('explore')) return event;
      if (!isEventWithExploreBody(event)) return event;
      return event.clone({
        body: {
          requestTime: Date.now(),
          results: event.body?.results || [],
          suggestions: event.body?.suggestions || [],
        },
      });
    }),
  );
};
