import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ProgressBarService } from '../progress-bar.service';

export const requestProgressInterceptor = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const progress = new ProgressBarService();
  const cleanUrl = req.url.split('?').at(0)!;
  progress.addProcess(cleanUrl);
  return next(req).pipe(
    finalize(() => {
      progress.removeProcess(cleanUrl);
    }),
  );
};
