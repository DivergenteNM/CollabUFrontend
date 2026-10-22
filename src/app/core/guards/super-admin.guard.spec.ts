import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { firstValueFrom, isObservable, of } from 'rxjs';
import { superAdminGuard } from './super-admin.guard';
import { AuthStore } from '../../state/auth.store';

describe('superAdminGuard', () => {
  function run(isSuperAdmin: boolean) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: { authReady: signal(true), isSuperAdmin: signal(isSuperAdmin) } },
      ],
    });
    return TestBed.runInInjectionContext(() => superAdminGuard({} as never, {} as never));
  }

  it('deja pasar al superadmin', async () => {
    const result = run(true);
    expect(await firstValueFrom(isObservable(result) ? result : of(result))).toBe(true);
  });

  it('manda al dashboard al admin de departamento', async () => {
    const result = run(false);
    const value = await firstValueFrom(isObservable(result) ? result : of(result));
    expect(value).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(value as UrlTree)).toBe('/dashboard');
  });
});
