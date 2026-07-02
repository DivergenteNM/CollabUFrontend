import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable()
export abstract class BaseApiService {
  protected readonly http = inject(HttpClient);
  protected abstract readonly basePath: string;

  protected get apiUrl(): string {
    return `${environment.apiUrl}${this.basePath}`;
  }

  protected buildParams(params: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => httpParams = httpParams.append(key, v));
        } else {
          httpParams = httpParams.set(key, value.toString());
        }
      }
    });
    return httpParams;
  }
}
