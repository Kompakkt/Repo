import { HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { ProgressBarService } from '../progress-bar.service';

@Injectable()
export class RequestProgressInterceptor implements HttpInterceptor {
  constructor(private progress: ProgressBarService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    this.progress.changeProgressState(true);
    return next.handle(req).pipe(
      finalize(() => {
        this.progress.changeProgressState(false);
      }),
    );
  }
}
