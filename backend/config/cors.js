// /backend/config/cors.js

const normalizeOrigin = (url) => (url ? url.trim().replace(/\/+$/, '') : '');

/**
 * Validate whether an incoming request origin is permitted by CORS.
 * Allows local development, configured FRONTEND_URL(s), and Vercel deployment URLs for this app.
 */
export function corsOriginValidator(origin, callback) {
    if (!origin) {
        return callback(null, true);
    }

    const cleanOrigin = normalizeOrigin(origin);
    const configuredOrigins = (process.env.FRONTEND_URL || '')
        .split(',')
        .map(normalizeOrigin)
        .filter(Boolean);

    const isAllowed =
        cleanOrigin === 'http://localhost:5173' ||
        configuredOrigins.includes(cleanOrigin) ||
        /^https:\/\/bustracking[\w-]*\.vercel\.app$/.test(cleanOrigin);

    if (isAllowed) {
        return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
}
