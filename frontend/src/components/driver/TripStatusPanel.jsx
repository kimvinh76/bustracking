import { MapPin, Clock, Navigation, Users } from "lucide-react";

export default function TripStatusPanel({
  tripStatus,
  currentStopIndex,
  stops,
  nextStop,
  remainingDistance,
  estimatedTime,
}) {
  return (
    <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-4 z-50 min-w-80 border border-gray-200">
      <div className="space-y-3">
        {/* Status & Progress */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                tripStatus === "completed"
                  ? "bg-green-500"
                  : tripStatus === "in_progress"
                  ? "bg-blue-500"
                  : tripStatus === "paused"
                  ? "bg-amber-500"
                  : "bg-gray-400"
              }`}
            ></div>
            <span className="font-semibold text-gray-800">
              {tripStatus === "completed"
                ? "🏁 Chuyến đã hoàn thành"
                : tripStatus === "in_progress"
                ? "🚍 Đang trong chuyến"
                : tripStatus === "paused"
                ? "⏸️ Đang dừng tại trạm"
                : "⏳ Chờ bắt đầu chuyến"}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {currentStopIndex + 1}/{stops.length} điểm
          </div>
        </div>

        {/* Pre-trip Status */}
        {tripStatus === "not_started" ? (
          <div className="text-center py-4">
            <div className="text-gray-600 mb-2">
              🚀 Sẵn sàng bắt đầu chuyến đi
            </div>
            <div className="text-sm text-gray-500">
              Nhấn nút "Bắt đầu chuyến" để khởi động
            </div>
          </div>
        ) : (
          <>
            {/* Next Stop Info */}
            {nextStop && tripStatus !== "completed" ? (
              <>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div className="font-semibold text-gray-800">
                    Điểm tiếp theo: {nextStop.name}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Navigation className="w-3 h-3" />
                    <span>→ Còn lại: {remainingDistance}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Dự kiến: {estimatedTime}</span>
                  </div>
                </div>


              </>
            ) : (
              <div className="text-center py-2">
                <div className="text-green-600 font-semibold">
                  {tripStatus === "completed"
                    ? "Đã hoàn thành tuyến"
                    : "Đã đến điểm cuối"}
                </div>
              </div>
            )}
          </>
        )}

        {/* Progress bar */}
        {tripStatus !== "not_started" && (
          <div className="pt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Tiến độ</span>
              <span>
                {Math.round(((currentStopIndex + 1) / stops.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${((currentStopIndex + 1) / stops.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
