import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/auth`;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should POST /auth/login with credentials', () => {
    const creds = { email: 'test@udenar.edu.co', password: 'Test1234!' };
    service.login(creds).subscribe(res => {
      expect(res.data).toBeDefined();
    });

    const req = httpTesting.expectOne(`${baseUrl}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(creds);
    req.flush({ data: { user: {}, accessToken: 'token', refreshToken: 'refresh' } });
  });

  it('should POST /auth/register with data', () => {
    const data = { email: 'new@udenar.edu.co', password: 'Test1234!', role: 'student' } as any;
    service.register(data).subscribe();

    const req = httpTesting.expectOne(`${baseUrl}/register`);
    expect(req.request.method).toBe('POST');
    req.flush({ data: { message: 'OK' } });
  });

  it('should POST /auth/refresh with stored refresh token', () => {
    localStorage.setItem('collabu_refresh_token', 'saved-refresh');
    service.refreshToken().subscribe();

    const req = httpTesting.expectOne(`${baseUrl}/refresh`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.refreshToken).toBe('saved-refresh');
    req.flush({ data: {} });
  });

  it('should POST /auth/forgot-password', () => {
    service.forgotPassword({ email: 'test@udenar.edu.co' }).subscribe();

    const req = httpTesting.expectOne(`${baseUrl}/forgot-password`);
    expect(req.request.method).toBe('POST');
    req.flush({ data: { message: 'OK' } });
  });

  it('should GET /auth/verify-email with token param', () => {
    service.verifyEmail('abc123').subscribe();

    const req = httpTesting.expectOne(`${baseUrl}/verify-email?token=abc123`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: { message: 'OK' } });
  });

  it('should POST /auth/logout', () => {
    service.logout().subscribe();

    const req = httpTesting.expectOne(`${baseUrl}/logout`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('should delegate getAccessToken to TokenService', () => {
    expect(service.getAccessToken()).toBeNull();
    localStorage.setItem('collabu_access_token', 'my-token');
    expect(service.getAccessToken()).toBe('my-token');
  });
});
