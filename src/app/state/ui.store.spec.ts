import { TestBed } from '@angular/core/testing';
import { UiStore } from './ui.store';

describe('UiStore', () => {
  let store: InstanceType<typeof UiStore>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(UiStore);
  });

  it('should start with default state', () => {
    expect(store.sidebarOpen()).toBe(true);
    expect(store.loadingCount()).toBe(0);
  });

  it('should toggle sidebar', () => {
    expect(store.sidebarOpen()).toBe(true);
    store.toggleSidebar();
    expect(store.sidebarOpen()).toBe(false);
    store.toggleSidebar();
    expect(store.sidebarOpen()).toBe(true);
  });

  it('should set sidebar open/closed', () => {
    store.setSidebarOpen(false);
    expect(store.sidebarOpen()).toBe(false);
    store.setSidebarOpen(true);
    expect(store.sidebarOpen()).toBe(true);
  });

  it('should persist theme to localStorage', () => {
    store.setTheme('dark');
    expect(store.theme()).toBe('dark');
    expect(localStorage.getItem('collabu_theme')).toBe('dark');
  });

  it('should compute isLoading from loadingCount', () => {
    expect(store.isLoading()).toBe(false);
    store.incrementLoading();
    expect(store.isLoading()).toBe(true);
    expect(store.loadingCount()).toBe(1);

    store.incrementLoading();
    expect(store.loadingCount()).toBe(2);

    store.decrementLoading();
    expect(store.isLoading()).toBe(true);
    store.decrementLoading();
    expect(store.isLoading()).toBe(false);
  });

  it('should not go below 0 in loadingCount', () => {
    store.decrementLoading();
    expect(store.loadingCount()).toBe(0);
    expect(store.isLoading()).toBe(false);
  });

  it('should set breadcrumbs', () => {
    const crumbs = [{ label: 'Home', url: '/' }, { label: 'Projects' }];
    store.setBreadcrumbs(crumbs);
    expect(store.breadcrumbs()).toEqual(crumbs);
  });

  it('should support theme values', () => {
    store.setTheme('light');
    expect(store.theme()).toBe('light');
    store.setTheme('dark');
    expect(store.theme()).toBe('dark');
    store.setTheme('system');
    expect(store.theme()).toBe('system');
  });
});
