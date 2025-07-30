import { HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { ProgressBarService } from '../progress-bar.service';

@Injectable()
export class RequestProgressInterceptor implements HttpInterceptor {
  constructor(private progress: ProgressBarService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler) {
    const cleanUrl = req.url.split('?').at(0)!;
    this.progress.addProcess(cleanUrl);
    return next.handle(req).pipe(
      finalize(() => {
        this.progress.removeProcess(cleanUrl);
      }),
    );
  }
}
