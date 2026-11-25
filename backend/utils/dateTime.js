const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

const vnPartsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: VIETNAM_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

export function getVietnamDateParts(input = new Date()) {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return null;

  const parts = Object.fromEntries(
    vnPartsFormatter.formatToParts(d).map((p) => [p.type, p.value])
  );

  const hour = parts.hour === '24' ? '00' : parts.hour;
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour,
    minute: parts.minute,
    second: parts.second,
  };
}

export function toVietnamMySqlDateTime(input = new Date()) {
  const p = getVietnamDateParts(input);
  if (!p) return null;
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
}

export function getVietnamDateString(input = new Date()) {
  const p = getVietnamDateParts(input);
  if (!p) return null;
  return `${p.year}-${p.month}-${p.day}`;
}

/**
 * Chuẩn hóa giá trị thời gian về chuỗi DATETIME (YYYY-MM-DD HH:mm:ss) theo giờ Việt Nam.
 * - Nếu đã là chuỗi wall-clock "YYYY-MM-DD HH:mm:ss" (không có Z / offset) thì giữ nguyên.
 * - Nếu là Date hoặc chuỗi ISO có múi giờ thì chuyển sang Asia/Ho_Chi_Minh.
 */
export function normalizeVietnamMySqlDateTime(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
      return trimmed.replace('T', ' ');
    }
  }
  return toVietnamMySqlDateTime(value);
}
