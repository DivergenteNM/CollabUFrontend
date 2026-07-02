import { TruncatePipe } from './truncate.pipe';

describe('TruncatePipe', () => {
  const pipe = new TruncatePipe();

  it('should return empty string for null', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should return unchanged string if shorter than maxLength', () => {
    expect(pipe.transform('Hello', 10)).toBe('Hello');
  });

  it('should return unchanged string if exactly maxLength', () => {
    expect(pipe.transform('12345', 5)).toBe('12345');
  });

  it('should truncate and add default suffix', () => {
    expect(pipe.transform('Hello World!', 5)).toBe('Hello...');
  });

  it('should use custom suffix', () => {
    expect(pipe.transform('Hello World!', 5, '…')).toBe('Hello…');
  });

  it('should default maxLength to 100', () => {
    const longText = 'a'.repeat(150);
    const result = pipe.transform(longText);
    expect(result.length).toBe(103); // 100 + '...'
  });
});
