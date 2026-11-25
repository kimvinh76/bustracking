import {
  toVietnamMySqlDateTime,
  getVietnamDateString,
  normalizeVietnamMySqlDateTime,
} from '../utils/dateTime.js';

describe('Vietnam dateTime helpers', () => {
  test('converts UTC Date to Asia/Ho_Chi_Minh (+07:00) DATETIME string', () => {
    const utcSample = new Date('2026-11-16T07:54:12.000Z');
    expect(toVietnamMySqlDateTime(utcSample)).toBe('2026-11-16 14:54:12');
    expect(getVietnamDateString(utcSample)).toBe('2026-11-16');
  });

  test('handles day rollover correctly across UTC midnight', () => {
    // 18:30 UTC is 01:30 next day in Vietnam
    const utcEvening = new Date('2026-11-16T18:30:05.000Z');
    expect(toVietnamMySqlDateTime(utcEvening)).toBe('2026-11-17 01:30:05');
    expect(getVietnamDateString(utcEvening)).toBe('2026-11-17');
  });

  test('handles midnight hour 00 cleanly without returning 24', () => {
    const vnMidnight = new Date('2026-11-16T17:00:00.000Z');
    expect(toVietnamMySqlDateTime(vnMidnight)).toBe('2026-11-17 00:00:00');
  });

  test('normalizes wall-clock strings vs ISO strings cleanly', () => {
    expect(normalizeVietnamMySqlDateTime('2026-11-16 14:54:00')).toBe('2026-11-16 14:54:00');
    expect(normalizeVietnamMySqlDateTime('2026-11-16T07:54:00.000Z')).toBe('2026-11-16 14:54:00');
    expect(normalizeVietnamMySqlDateTime('')).toBeNull();
    expect(normalizeVietnamMySqlDateTime('invalid')).toBeNull();
  });
});
