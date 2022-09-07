import { HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';

@Injectable()
export class ExploreTimingInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe(
      map(event =>
        event instanceof HttpResponse && req.url.endsWith('explore')
          ? event.clone({
              body: {
                requestTime: Date.now(),
                array: event.body,
              },
            })
          : event,
      ),
    );
  }
}
