import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { UiStore } from '../../state/ui.store';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const uiStore = inject(UiStore);

  const skipUrls = ['/notifications/unread-count', '/health'];
  const skip = skipUrls.some(url => req.url.includes(url));

  if (!skip) {
    uiStore.incrementLoading();
  }

  return next(req).pipe(
    finalize(() => {
      if (!skip) {
        uiStore.decrementLoading();
      }
    })
  );
};
