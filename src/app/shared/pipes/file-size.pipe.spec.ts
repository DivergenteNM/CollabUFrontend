import { FileSizePipe } from './file-size.pipe';

describe('FileSizePipe', () => {
  const pipe = new FileSizePipe();

  it('should return "0 B" for null', () => {
    expect(pipe.transform(null)).toBe('0 B');
  });

  it('should return "0 B" for undefined', () => {
    expect(pipe.transform(undefined)).toBe('0 B');
  });

  it('should return "0 B" for negative values', () => {
    expect(pipe.transform(-100)).toBe('0 B');
  });

  it('should return bytes without decimals', () => {
    expect(pipe.transform(512)).toBe('512 B');
  });

  it('should return 0 B for zero', () => {
    expect(pipe.transform(0)).toBe('0 B');
  });

  it('should convert to KB', () => {
    expect(pipe.transform(1536)).toBe('1.5 KB');
  });

  it('should convert to MB', () => {
    expect(pipe.transform(2 * 1048576)).toBe('2.0 MB');
  });

  it('should convert to GB', () => {
    expect(pipe.transform(1.5 * 1073741824)).toBe('1.5 GB');
  });

  it('should handle exactly 1024 as KB', () => {
    expect(pipe.transform(1024)).toBe('1.0 KB');
  });
});
