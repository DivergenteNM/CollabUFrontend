import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { TokenService } from '../services/token.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let tokenService: TokenService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    tokenService = TestBed.inject(TokenService);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should add Authorization header when token exists', () => {
    tokenService.saveTokens('my-token', 'refresh');

    http.get('/api/v1/projects').subscribe();

    const req = httpTesting.expectOne('/api/v1/projects');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-token');
    req.flush({});
  });

  it('should NOT add header when no token exists', () => {
    http.get('/api/v1/projects').subscribe();

    const req = httpTesting.expectOne('/api/v1/projects');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should skip public auth URLs even with token', () => {
    tokenService.saveTokens('my-token', 'refresh');

    http.post('/api/v1/auth/login', {}).subscribe();

    const req = httpTesting.expectOne('/api/v1/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should skip register URL', () => {
    tokenService.saveTokens('my-token', 'refresh');

    http.post('/api/v1/auth/register', {}).subscribe();

    const req = httpTesting.expectOne('/api/v1/auth/register');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
