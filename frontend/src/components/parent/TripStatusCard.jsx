// Component hiển thị trạng thái chuyến đi + timeline từng trạm trực quan cho phụ huynh
import {
  getStopProgressState,
  getPassedStopCount,
  normalizeDriverStatus,
} from '../../utils/mergeBusStatus';

export default function TripStatusCard({
  driverStatus,
  currentStopIndex = 0,
  stops = [],
  nextStop,
  childStopId = null,
}) {
  const normalizedStatus = normalizeDriverStatus(driverStatus);

  const getStatusDisplay = () => {
    switch (normalizedStatus) {
      case 'in_progress':
        return { text: 'Đang di chuyển', color: 'bg-blue-50 border-blue-500 text-blue-900' };
      case 'paused':
        return { text: 'Đang dừng đón/trả học sinh', color: 'bg-amber-50 border-amber-500 text-amber-900' };
      case 'completed':
        return { text: 'Đã hoàn thành chuyến', color: 'bg-emerald-50 border-emerald-500 text-emerald-900' };
      default:
        return { text: 'Chưa bắt đầu', color: 'bg-gray-50 border-gray-400 text-gray-800' };
    }
  };

  const status = getStatusDisplay();
  const isPaused = normalizedStatus === 'paused';
  const isCompleted = normalizedStatus === 'completed';
  const isIdle = normalizedStatus === 'idle';
  const childStopIdx = childStopId
    ? stops.findIndex((s) => String(s.id) === String(childStopId))
    : -1;

  const currentIdx = Math.min(Math.max(currentStopIndex, 0), Math.max(stops.length - 1, 0));
  const currentStop = stops[currentIdx] || null;
  const passedCount = getPassedStopCount(currentIdx, normalizedStatus, stops.length);

  const childStopProgress =
    childStopIdx >= 0 && !isCompleted && !isIdle
      ? getStopProgressState(childStopIdx, currentIdx, normalizedStatus)
      : null;

  const getChildStopBadge = () => {
    if (!childStopProgress) return null;
    if (childStopProgress.state === 'passed') {
      return { text: 'Đã qua trạm của bé', cls: 'bg-emerald-100 text-emerald-800' };
    }
    if (childStopProgress.state === 'stopped') {
      return { text: 'Xe đang dừng tại trạm của bé', cls: 'bg-amber-200 text-amber-900' };
    }
    if (childStopProgress.state === 'approaching') {
      return { text: 'Xe đang tới trạm của bé', cls: 'bg-blue-200 text-blue-900' };
    }
    const stopsAway = Math.max(1, childStopIdx - currentIdx);
    return {
      text: `Còn ${stopsAway} trạm tới điểm của bé`,
      cls: 'bg-blue-100 text-blue-800',
    };
  };

  const childBadge = getChildStopBadge();

  return (
    <div className={`p-5 rounded-xl shadow-sm border-l-4 ${status.color}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold">Trạng thái chuyến đi</h2>
          <p className="text-sm mt-0.5">
            <strong>{status.text}</strong>
            {isPaused && currentStop && (
              <span className="text-gray-600"> · Tại trạm: <strong>{currentStop.name}</strong></span>
            )}
            {normalizedStatus === 'in_progress' && nextStop && (
              <span className="text-gray-600"> · Đang tới: <strong>{nextStop.name}</strong></span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {childBadge && (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${childBadge.cls}`}>
              {childBadge.text}
            </span>
          )}
          <div className="text-right">
            <span className="text-2xl font-bold text-[#174D2C]">
              {stops.length > 0 ? `${passedCount}/${stops.length}` : '0/0'}
            </span>
            <span className="block text-[11px] text-gray-500">Tiến độ trạm</span>
          </div>
        </div>
      </div>

      {/* Lộ trình từng trạm trực quan */}
      {stops.length > 0 && (
        <div className="bg-white/90 rounded-lg border border-gray-200 p-3 space-y-2 max-h-56 overflow-y-auto">
          {stops.map((stop, idx) => {
            const { state, label } = getStopProgressState(idx, currentIdx, normalizedStatus);
            const isPassed = state === 'passed';
            const isStopped = state === 'stopped';
            const isApproaching = state === 'approaching';
            const isChildStop = childStopId && String(stop.id) === String(childStopId);

            return (
              <div
                key={stop.id ?? idx}
                className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs ${
                  isChildStop
                    ? 'bg-emerald-50 border border-emerald-200'
                    : isStopped
                      ? 'bg-amber-50 border border-amber-200'
                      : isApproaching
                        ? 'bg-blue-50 border border-blue-200'
                        : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      isPassed
                        ? 'bg-emerald-600 text-white'
                        : isStopped
                          ? 'bg-amber-500 text-white'
                          : isApproaching
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {isPassed ? '✓' : idx + 1}
                  </span>
                  <span
                    className={`truncate ${
                      isStopped || isApproaching
                        ? 'font-bold text-gray-900'
                        : isPassed
                          ? 'text-gray-500'
                          : 'text-gray-800 font-medium'
                    }`}
                  >
                    {stop.name}
                  </span>
                  {isChildStop && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#174D2C] text-white text-[10px] font-semibold">
                      Trạm của bé
                    </span>
                  )}
                </div>

                <span
                  className={`shrink-0 font-medium ${
                    isPassed
                      ? 'text-emerald-700'
                      : isStopped
                        ? 'text-amber-700'
                        : isApproaching
                          ? 'text-blue-700'
                          : 'text-gray-400'
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
