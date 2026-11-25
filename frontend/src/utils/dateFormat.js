export function parseSafeDate(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  let normalized = String(value).trim();
  if (!normalized || normalized.startsWith('0000-00-00')) return null;

  // Chuyển định dạng MySQL DATETIME ("YYYY-MM-DD HH:MM:SS") sang dạng chuẩn trình duyệt
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(normalized)) {
    normalized = normalized.replace(' ', 'T');
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDateTimeVi(value, fallback = '--') {
  const d = parseSafeDate(value);
  if (!d) return fallback;
  return d.toLocaleString('vi-VN');
}

export function formatDateVi(value, options, fallback = '--') {
  const d = parseSafeDate(value);
  if (!d) return fallback;
  return d.toLocaleDateString('vi-VN', options);
}

export function formatTimeShortVi(value, fallback = '--:--') {
  if (value === null || value === undefined || value === '') return fallback;
  const raw = String(value).trim();
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(raw)) {
    return raw.slice(0, 5);
  }
  const d = parseSafeDate(raw);
  if (!d) return fallback;
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export function formatTimeFullVi(value, fallback = '--:--') {
  const d = parseSafeDate(value);
  if (!d) return fallback;
  return d.toLocaleTimeString('vi-VN');
}
