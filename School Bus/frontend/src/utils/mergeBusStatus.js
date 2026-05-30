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
