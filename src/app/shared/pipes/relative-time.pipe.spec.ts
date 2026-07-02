import { RelativeTimePipe } from './relative-time.pipe';

describe('RelativeTimePipe', () => {
  const pipe = new RelativeTimePipe();

  it('should return empty string for null', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should transform a recent Date to a relative string', () => {
    const now = new Date();
    const result = pipe.transform(now);
    expect(result).toContain('menos de un minuto');
  });

  it('should transform an ISO string', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const result = pipe.transform(fiveMinutesAgo);
    expect(result).toContain('minutos');
  });

  it('should include suffix "hace"', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const result = pipe.transform(oneHourAgo);
    expect(result).toContain('hace');
  });
});
