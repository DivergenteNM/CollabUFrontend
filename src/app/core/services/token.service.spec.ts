import { TestBed } from '@angular/core/testing';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenService);
  });

  it('should return null when no tokens stored', () => {
    expect(service.getAccessToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
    expect(service.getUser()).toBeNull();
  });

  it('should save and retrieve tokens', () => {
    service.saveTokens('access-123', 'refresh-456');

    expect(service.getAccessToken()).toBe('access-123');
    expect(service.getRefreshToken()).toBe('refresh-456');
  });

  it('should clear tokens', () => {
    service.saveTokens('access', 'refresh');
    service.saveUser({ id: '1', email: 'test@test.com' } as any);

    service.clearTokens();

    expect(service.getAccessToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
    expect(service.getUser()).toBeNull();
  });

  it('should save and retrieve user', () => {
    const user = { id: '1', email: 'test@udenar.edu.co', role: 'student' } as any;
    service.saveUser(user);

    const retrieved = service.getUser();
    expect(retrieved).toEqual(user);
    expect(retrieved?.email).toBe('test@udenar.edu.co');
  });
});
