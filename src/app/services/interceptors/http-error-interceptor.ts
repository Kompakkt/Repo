import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// TODO: Move this to the actual HttpClient requests in BackendService
export const httpErrorInterceptor = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  return next(req).pipe(
    catchError(err => {
      if (err instanceof HttpErrorResponse) {
        console.warn(`${req.method} request to ${req.url} failed with`, err);
        return of(new HttpResponse({ body: undefined, status: 200 }));
      }
      throw err;
    }),
  );
};
