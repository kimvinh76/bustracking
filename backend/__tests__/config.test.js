import { corsOriginValidator } from '../config/cors.js';
import { normalizeRedisUrl, isValidRedisUrl } from '../config/redis.js';

describe('corsOriginValidator', () => {
  const originalFrontendUrl = process.env.FRONTEND_URL;

  afterEach(() => {
    if (originalFrontendUrl === undefined) {
      delete process.env.FRONTEND_URL;
    } else {
      process.env.FRONTEND_URL = originalFrontendUrl;
    }
  });

  test('allows requests without an origin header', (done) => {
    corsOriginValidator(undefined, (err, allowed) => {
      expect(err).toBeNull();
      expect(allowed).toBe(true);
      done();
    });
  });

  test('allows localhost:5173 and bustracking Vercel previews', (done) => {
    corsOriginValidator('http://localhost:5173', (err, allowed) => {
      expect(err).toBeNull();
      expect(allowed).toBe(true);

      corsOriginValidator('https://bustracking-pied.vercel.app', (err2, allowed2) => {
        expect(err2).toBeNull();
        expect(allowed2).toBe(true);
        done();
      });
    });
  });

  test('allows configured FRONTEND_URL with trailing slash normalized', (done) => {
    process.env.FRONTEND_URL = 'https://custom.example.com/';
    corsOriginValidator('https://custom.example.com', (err, allowed) => {
      expect(err).toBeNull();
      expect(allowed).toBe(true);
      done();
    });
  });

  test('rejects unknown origins', (done) => {
    corsOriginValidator('https://evil.example.com', (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toMatch(/Not allowed by CORS/);
      done();
    });
  });
});

describe('redis URL helpers', () => {
  test('normalizes whitespace, surrounding quotes, and redis-cli command', () => {
    expect(normalizeRedisUrl('  "redis://localhost:6379"  ')).toBe('redis://localhost:6379');
    expect(normalizeRedisUrl("redis-cli -u redis://default:secret@host:1234")).toBe('redis://default:secret@host:1234');
    expect(normalizeRedisUrl("redis-cli --tls -u redis://default:secret@host:6379")).toBe('rediss://default:secret@host:6379');
    expect(normalizeRedisUrl("redis://default:secret@thorough-dove-173888.upstash.io:6379")).toBe('rediss://default:secret@thorough-dove-173888.upstash.io:6379');
  });

  test('validates redis:// and rediss:// URLs and rejects invalid values', () => {
    expect(isValidRedisUrl('redis://localhost:6379')).toBe(true);
    expect(isValidRedisUrl('rediss://default:pass@example.com:6380')).toBe(true);
    expect(isValidRedisUrl('example.com:6379')).toBe(false);
    expect(isValidRedisUrl('http://localhost:6379')).toBe(false);
    expect(isValidRedisUrl('')).toBe(false);
  });
});
