import { HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';

@Injectable()
export class ExploreTimingInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe(
      map(event => {
        if (event instanceof HttpResponse && req.url.endsWith('explore')) {
          return event.clone({
            body: {
              requestTime: Date.now(),
              array: event.body,
            },
          });
        }
        return event;
      }),
    );
  }
}
