import { HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class HttpOptionsInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const modifiedReq = req.clone({
      withCredentials: true,
      headers: req.headers.set('Content-Type', 'application/json'),
    });

    return next.handle(modifiedReq);
  }
}
