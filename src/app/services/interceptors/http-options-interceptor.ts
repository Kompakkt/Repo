import { HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class HttpOptionsInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const isFormData = req.body instanceof FormData;

    const headers = req.headers;
    if (!isFormData) {
      req.headers.set('Content-Type', 'application/json');
    }

    const modifiedReq = req.clone({ withCredentials: true, headers });

    return next.handle(modifiedReq);
  }
}
