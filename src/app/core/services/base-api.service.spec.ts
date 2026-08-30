import { describe, it, expect, beforeEach } from 'vitest';
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { BaseApiService } from './base-api.service';
import { environment } from '../../../environments/environment';

@Injectable()
class TestApiService extends BaseApiService {
  protected readonly basePath = '/test-resource';

  get url() {
    return this.apiUrl;
  }

  params(p: Record<string, any>) {
    return this.buildParams(p);
  }
}

describe('BaseApiService', () => {
  let service: TestApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), TestApiService],
    });
    service = TestBed.inject(TestApiService);
  });

  it('apiUrl concatena environment.apiUrl con el basePath de la subclase', () => {
    expect(service.url).toBe(`${environment.apiUrl}/test-resource`);
  });

  describe('buildParams', () => {
    it('omite claves con valor undefined, null o cadena vacía', () => {
      const params = service.params({ a: undefined, b: null, c: '', d: 'valor' });

      expect(params.has('a')).toBe(false);
      expect(params.has('b')).toBe(false);
      expect(params.has('c')).toBe(false);
      expect(params.get('d')).toBe('valor');
    });

    it('convierte valores no-string a string', () => {
      const params = service.params({ page: 2, active: true });

      expect(params.get('page')).toBe('2');
      expect(params.get('active')).toBe('true');
    });

    it('agrega cada elemento de un array como una entrada repetida con append', () => {
      const params = service.params({ tags: ['a', 'b', 'c'] });

      expect(params.getAll('tags')).toEqual(['a', 'b', 'c']);
    });

    it('con params vacío retorna un HttpParams sin claves', () => {
      const params = service.params({});
      expect(params.keys().length).toBe(0);
    });
  });
});
