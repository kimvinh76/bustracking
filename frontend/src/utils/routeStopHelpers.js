const EARTH_RADIUS_KM = 6371;

export function normalizeStop(raw) {
  if (!raw) return null;
  const stopId = Number(raw.stop_id ?? raw.id);
  return {
    ...raw,
    id: stopId,
    stop_id: stopId,
    name: raw.name || `Trạm #${stopId}`,
    address: raw.address || '',
    latitude: Number(raw.latitude ?? raw.lat),
    longitude: Number(raw.longitude ?? raw.lng),
    stop_order: raw.stop_order !== undefined ? Number(raw.stop_order) : undefined,
  };
}

export function isValidLatLng(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

export function isSchoolStop(stop) {
  if (!stop) return false;
  const id = Number(stop.stop_id ?? stop.id);
  // Trạm trường mặc định: id 43 = Trường Đại học Sài Gòn (273 An Dương Vương, Q.5)
  if (id === 43) return true;
  // Chỉ khớp "Trường (Đại học) Sài Gòn", tránh nhầm với "Cầu Sài Gòn"
  const plainName = String(stop.name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase();
  return /truong\s+(dai\s+hoc\s+)?sai\s*gon/.test(plainName);
}

export function haversineKm(lat1, lng1, lat2, lng2) {
  if (!isValidLatLng(lat1, lng1) || !isValidLatLng(lat2, lng2)) return 0;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function applySchoolLockOrder(stops, shiftType, lockSchool) {
  const list = [...stops];
  if (!lockSchool || list.length <= 1) return list;

  const schoolIndex = list.findIndex(isSchoolStop);
  if (schoolIndex === -1) return list;

  const [schoolStop] = list.splice(schoolIndex, 1);
  if (shiftType === 'morning') {
    list.push(schoolStop);
  } else {
    list.unshift(schoolStop);
  }
  return list;
}

/**
 * Sắp xếp thứ tự các trạm theo láng giềng gần nhất (Nearest-Neighbor)
 * để tránh tuyến đi vòng vèo trước khi lưu.
 */
export function optimizeStopOrder(stops, { shiftType = 'morning', lockSchool = true } = {}) {
  const ordered = applySchoolLockOrder(stops, shiftType, lockSchool);
  if (ordered.length < 3) return ordered;

  const schoolIndex = lockSchool ? ordered.findIndex(isSchoolStop) : -1;

  if (shiftType === 'morning' && lockSchool && schoolIndex === ordered.length - 1) {
    const school = ordered[schoolIndex];
    const remaining = ordered.slice(0, schoolIndex);

    // Ca sáng: bắt đầu từ trạm xa trường nhất rồi gom dần về phía trường
    let startIdx = 0;
    let maxDist = -1;
    remaining.forEach((s, idx) => {
      const d = haversineKm(s.latitude, s.longitude, school.latitude, school.longitude);
      if (d > maxDist) {
        maxDist = d;
        startIdx = idx;
      }
    });

    const result = [remaining.splice(startIdx, 1)[0]];
    while (remaining.length > 0) {
      const curr = result[result.length - 1];
      let bestIdx = 0;
      let bestDist = Infinity;
      remaining.forEach((candidate, idx) => {
        const d = haversineKm(curr.latitude, curr.longitude, candidate.latitude, candidate.longitude);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = idx;
        }
      });
      result.push(remaining.splice(bestIdx, 1)[0]);
    }
    result.push(school);
    return result;
  }

  // Ca chiều hoặc tuyến tự do: giữ cố định điểm đầu và nối dần các trạm gần nhất
  const remaining = [...ordered];
  const result = [remaining.shift()];
  while (remaining.length > 0) {
    const curr = result[result.length - 1];
    let bestIdx = 0;
    let bestDist = Infinity;
    remaining.forEach((candidate, idx) => {
      const d = haversineKm(curr.latitude, curr.longitude, candidate.latitude, candidate.longitude);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = idx;
      }
    });
    result.push(remaining.splice(bestIdx, 1)[0]);
  }
  return result;
}

export function buildStopsSavePayload(stops) {
  return stops.map((s, idx) => {
    let stopOrder;
    if (stops.length === 1 || idx === 0) {
      stopOrder = 0;
    } else if (idx === stops.length - 1) {
      stopOrder = 99;
    } else {
      stopOrder = idx;
    }
    return {
      stop_id: Number(s.stop_id ?? s.id),
      stop_order: stopOrder,
    };
  });
}
