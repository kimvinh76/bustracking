// Component hiển thị trạng thái chuyến đi + timeline từng trạm trực quan cho phụ huynh
export default function TripStatusCard({
  driverStatus,
  currentStopIndex = 0,
  stops = [],
  nextStop,
  childStopId = null,
}) {
  const getStatusDisplay = () => {
    switch (driverStatus) {
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
  const isPaused = driverStatus === 'paused';
  const isCompleted = driverStatus === 'completed';
  const childStopIdx = childStopId
    ? stops.findIndex((s) => String(s.id) === String(childStopId))
    : -1;

  const currentIdx = Math.min(Math.max(currentStopIndex, 0), Math.max(stops.length - 1, 0));
  const remainingToChild =
    childStopIdx >= 0 && !isCompleted ? childStopIdx - currentIdx : null;

  return (
    <div className={`p-5 rounded-xl shadow-sm border-l-4 ${status.color}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold">Trạng thái chuyến đi</h2>
          <p className="text-sm mt-0.5">
            <strong>{status.text}</strong>
            {!isCompleted && nextStop && (
              <span className="text-gray-600"> · Trạm kế tiếp: <strong>{nextStop.name}</strong></span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {remainingToChild !== null && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                remainingToChild < 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : remainingToChild === 0
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-blue-100 text-blue-800'
              }`}
            >
              {remainingToChild < 0
                ? 'Đã qua trạm của bé'
                : remainingToChild === 0
                  ? isPaused
                    ? 'Xe đang ở trạm của bé'
                    : 'Đang ở trạm của bé'
                  : `Còn ${remainingToChild} trạm tới điểm của bé`}
            </span>
          )}
          <div className="text-right">
            <span className="text-2xl font-bold text-[#174D2C]">
              {stops.length > 0 ? `${currentIdx + 1}/${stops.length}` : '0/0'}
            </span>
            <span className="block text-[11px] text-gray-500">Tiến độ trạm</span>
          </div>
        </div>
      </div>

      {/* Lộ trình từng trạm trực quan */}
      {stops.length > 0 && (
        <div className="bg-white/90 rounded-lg border border-gray-200 p-3 space-y-2 max-h-56 overflow-y-auto">
          {stops.map((stop, idx) => {
            const isPassed = isCompleted || idx < currentIdx || (driverStatus === 'in_progress' && idx === 0 && currentIdx > 0);
            const isCurrent = !isCompleted && idx === currentIdx;
            const isChildStop = childStopId && String(stop.id) === String(childStopId);

            return (
              <div
                key={stop.id ?? idx}
                className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs ${
                  isChildStop
                    ? 'bg-emerald-50 border border-emerald-200'
                    : isCurrent
                      ? 'bg-amber-50 border border-amber-200'
                      : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      isPassed
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {isPassed ? '✓' : idx + 1}
                  </span>
                  <span
                    className={`truncate ${
                      isCurrent
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
                      : isCurrent
                        ? 'text-amber-700'
                        : 'text-gray-400'
                  }`}
                >
                  {isPassed
                    ? 'Đã qua'
                    : isCurrent
                      ? isPaused
                        ? 'Đang dừng tại trạm'
                        : 'Đang di chuyển'
                      : 'Chưa tới'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
