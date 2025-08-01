import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

export const httpOptionsInterceptor = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const isFormData = req.body instanceof FormData;

  const headers = req.headers;
  if (!isFormData) {
    req.headers.set('Content-Type', 'application/json');
  }

  const modifiedReq = req.clone({ withCredentials: true, headers });

  return next(modifiedReq);
};
