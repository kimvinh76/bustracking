/** Gộp payload WebSocket vào state bus (dùng chung admin/parent). */
export function normalizeDriverStatus(status) {
  if (!status || status === "not_started") return "idle";
  return status;
}

export function mergeBusStatus(prev, incoming) {
  if (!incoming) return prev;
  const rawStatus = incoming.driverStatus ?? prev.driverStatus;
  return {
    ...prev,
    ...incoming,
    driverStatus: normalizeDriverStatus(rawStatus),
    currentStopIndex: incoming.currentStopIndex ?? prev.currentStopIndex,
    currentPosition: incoming.currentPosition || prev.currentPosition,
  };
}

export const INITIAL_BUS_STATUS = {
  isRunning: false,
  driverStatus: "idle",
  currentStopIndex: 0,
  currentPosition: null,
};

export function isTripActiveOnMap(driverStatus) {
  const s = normalizeDriverStatus(driverStatus);
  return s === "in_progress" || s === "paused";
}

export function isPreTripOnMap(driverStatus) {
  const s = normalizeDriverStatus(driverStatus);
  return s === "idle";
}

/**
 * Chuẩn hóa trạng thái từng trạm theo semantics thực tế từ tripSimulationService:
 * - idle: chưa chạy -> mọi trạm đều "Chưa tới"
 * - completed: đã kết thúc -> mọi trạm đều "Đã qua"
 * - paused: xe đang dừng TẠI currentStopIndex (<: Đã qua, ===: Đang dừng, >: Chưa tới)
 * - in_progress: xe ĐÃ RỜI currentStopIndex và đang hướng tới currentStopIndex + 1
 *   (<=: Đã qua, === currentStopIndex + 1: Đang tới, >: Chưa tới)
 */
export function getStopProgressState(stopIndex, currentStopIndex = 0, driverStatus = "idle") {
  const status = normalizeDriverStatus(driverStatus);
  const currentIdx = Number.isFinite(currentStopIndex) ? currentStopIndex : 0;

  if (status === "completed") {
    return { state: "passed", label: "Đã qua", shortLabel: "Đã qua" };
  }
  if (status === "idle") {
    return { state: "upcoming", label: "Chưa tới", shortLabel: "Chưa tới" };
  }
  if (status === "paused") {
    if (stopIndex < currentIdx) {
      return { state: "passed", label: "Đã qua", shortLabel: "Đã qua" };
    }
    if (stopIndex === currentIdx) {
      return { state: "stopped", label: "Đang dừng tại trạm", shortLabel: "Đang dừng" };
    }
    return { state: "upcoming", label: "Chưa tới", shortLabel: "Chưa tới" };
  }

  // in_progress
  if (stopIndex <= currentIdx) {
    return { state: "passed", label: "Đã qua", shortLabel: "Đã qua" };
  }
  if (stopIndex === currentIdx + 1) {
    return { state: "approaching", label: "Đang tới", shortLabel: "Đang tới" };
  }
  return { state: "upcoming", label: "Chưa tới", shortLabel: "Chưa tới" };
}

/** Số trạm đã đạt/đi qua để hiển thị tiến độ đồng nhất (0/N khi chưa chạy, N/N khi hoàn thành). */
export function getPassedStopCount(currentStopIndex = 0, driverStatus = "idle", totalStops = 0) {
  if (totalStops <= 0) return 0;
  const status = normalizeDriverStatus(driverStatus);
  if (status === "idle") return 0;
  if (status === "completed") return totalStops;
  const idx = Math.min(Math.max(Number(currentStopIndex) || 0, 0), totalStops - 1);
  return idx + 1;
}
