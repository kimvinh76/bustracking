const PROD_BACKEND_ORIGIN = "https://bustracking-w7as.onrender.com";

const isLocalhostHost = () => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "[::1]"
  );
};

const isLocalUrl = (value) => {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return (
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "::1" ||
      parsed.hostname === "[::1]"
    );
  } catch {
    return /:\/\/(localhost|127\.0\.0\.1|\[::1\]|::1)(:|\/|$)/i.test(trimmed);
  }
};

const resolveUrl = (envValue, deployedFallback, localFallback) => {
  const trimmed = typeof envValue === "string" ? envValue.trim() : "";
  if (!isLocalhostHost()) {
    // Deployed environments (Vercel prod/preview) must never call localhost.
    if (!trimmed || isLocalUrl(trimmed)) {
      return deployedFallback;
    }
    return trimmed.replace(/\/+$/, "");
  }
  return (trimmed || localFallback).replace(/\/+$/, "");
};

export const API_BASE_URL = resolveUrl(
  import.meta.env.VITE_API_BASE_URL,
  `${PROD_BACKEND_ORIGIN}/api`,
  "http://localhost:5000/api"
);

export const SOCKET_URL = resolveUrl(
  import.meta.env.VITE_SOCKET_URL || API_BASE_URL.replace(/\/api\/?$/, ""),
  PROD_BACKEND_ORIGIN,
  "http://localhost:5000"
);
