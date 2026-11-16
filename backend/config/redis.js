import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Normalize REDIS_URL from environment variables.
 * Strips surrounding quotes/whitespace, handles `redis-cli [--tls] -u <url>`,
 * and upgrades `redis://` to `rediss://` when TLS is required (e.g. `--tls` or Upstash).
 */
export function normalizeRedisUrl(rawValue) {
    if (typeof rawValue !== 'string') return '';
    let cleaned = rawValue.trim().replace(/^["']|["']$/g, '').trim();
    let forceTls = false;

    if (/^redis-cli\b/i.test(cleaned)) {
        forceTls = /\s--tls(?:\s|$)/i.test(cleaned);
        const match = cleaned.match(/-u\s+["']?([^\s"']+)["']?/i);
        cleaned = match ? match[1].trim() : '';
    }

    if (/^redis:\/\//i.test(cleaned)) {
        try {
            const parsed = new URL(cleaned);
            if (forceTls || parsed.hostname.endsWith('.upstash.io')) {
                cleaned = cleaned.replace(/^redis:\/\//i, 'rediss://');
            }
        } catch {
            // Keep as-is so isValidRedisUrl rejects malformed URLs cleanly.
        }
    }

    return cleaned;
}

/**
 * Validate whether a Redis URL uses redis:// or rediss:// and parses cleanly.
 */
export function isValidRedisUrl(url) {
    if (!url || !/^rediss?:\/\//i.test(url)) return false;
    try {
        const parsed = new URL(url);
        return Boolean(parsed.hostname);
    } catch {
        return false;
    }
}

const rawEnvRedisUrl = process.env.REDIS_URL;
const normalizedEnvUrl = normalizeRedisUrl(rawEnvRedisUrl);
const hasExplicitRedisUrl = Boolean(rawEnvRedisUrl && rawEnvRedisUrl.trim());
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const candidateUrl = hasExplicitRedisUrl
    ? normalizedEnvUrl
    : ((isProduction || isTest) ? '' : 'redis://localhost:6379');

let redisClient = {
    isReady: false,
    isOpen: false,
    on: () => {},
    connect: async () => {},
    ensureConnected: async () => false,
    ping: async () => null,
    keys: async () => [],
    get: async () => null,
    set: async () => null,
    del: async () => 0,
};

if ((isProduction || isTest) && !hasExplicitRedisUrl) {
    if (isProduction) {
        console.warn('REDIS_URL is not configured in production. Running without Redis cache.');
    }
} else if (!isValidRedisUrl(candidateUrl)) {
    console.warn('Invalid REDIS_URL (expected redis:// or rediss://). Running without Redis cache.');
} else {
    try {
        const client = createClient({
            url: candidateUrl,
            socket: {
                connectTimeout: 5000,
                reconnectStrategy: (retries) => {
                    if (!hasExplicitRedisUrl && retries >= 1) {
                        return new Error('Local Redis unavailable');
                    }
                    if (retries >= 5) {
                        return new Error('Redis reconnect limit reached');
                    }
                    return Math.min(retries * 500, 3000);
                },
            },
        });

        client.on('error', (err) => console.error('Redis Client Error:', err?.message || err?.code || String(err)));
        client.on('connect', () => console.log('Redis Client Connected to', candidateUrl.replace(/:\/\/[^@]+@/, '://***@')));

        const connectPromise = client.connect().catch((e) => {
            console.error('Redis connection failed:', e?.message || e);
            return null;
        });

        client.ensureConnected = async () => {
            if (client.isReady) return true;
            await connectPromise;
            return Boolean(client.isReady);
        };

        redisClient = client;
    } catch (err) {
        console.error('Redis client initialization failed:', err?.message || err);
    }
}

export default redisClient;
