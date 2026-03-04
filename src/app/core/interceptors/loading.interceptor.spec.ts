import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { loadingInterceptor } from './loading.interceptor';
import { UiStore } from '../../state/ui.store';

describe('loadingInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let uiStore: InstanceType<typeof UiStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    uiStore = TestBed.inject(UiStore);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should increment loading on request start', () => {
    expect(uiStore.loadingCount()).toBe(0);

    http.get('/api/v1/projects').subscribe();
    expect(uiStore.loadingCount()).toBe(1);

    httpTesting.expectOne('/api/v1/projects').flush({});
  });

  it('should decrement loading on response', () => {
    http.get('/api/v1/projects').subscribe();
    expect(uiStore.loadingCount()).toBe(1);

    httpTesting.expectOne('/api/v1/projects').flush({});
    expect(uiStore.loadingCount()).toBe(0);
  });

  it('should skip loading for notifications/unread-count', () => {
    http.get('/api/v1/notifications/unread-count').subscribe();
    expect(uiStore.loadingCount()).toBe(0);

    httpTesting.expectOne('/api/v1/notifications/unread-count').flush({});
    expect(uiStore.loadingCount()).toBe(0);
  });

  it('should skip loading for health check', () => {
    http.get('/health').subscribe();
    expect(uiStore.loadingCount()).toBe(0);

    httpTesting.expectOne('/health').flush({});
  });

  it('should decrement on error too', () => {
    http.get('/api/v1/projects').subscribe({ error: () => {} });
    expect(uiStore.loadingCount()).toBe(1);

    httpTesting.expectOne('/api/v1/projects').error(new ProgressEvent('error'));
    expect(uiStore.loadingCount()).toBe(0);
  });
});
