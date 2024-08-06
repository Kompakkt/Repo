import { HttpErrorResponse, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe(
      catchError(err => {
        if (err instanceof HttpErrorResponse) {
          console.warn(`${req.method} request to ${req.url} failed with`, err);
          return of(new HttpResponse({ body: undefined, status: 200 }));
        }
        throw err;
      }),
    );
  }
}
