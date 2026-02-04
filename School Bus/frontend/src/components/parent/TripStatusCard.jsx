// Component hiển thị trạng thái chuyến đi
export default function TripStatusCard({ driverStatus, currentStopIndex, stops, nextStop }) {
  // Xác định trạng thái hiển thị
  const getStatusDisplay = () => {
    switch (driverStatus) {
      case 'in_progress':
        return { text: 'Đang di chuyển', color: 'bg-blue-100 border-blue-500 text-blue-800' };
      case 'paused':
        return { text: 'Đang đón học sinh', color: 'bg-yellow-100 border-yellow-500 text-yellow-800' };
      case 'completed':
        return { text: 'Đã hoàn thành', color: 'bg-green-100 border-green-500 text-green-800' };
      default:
        return { text: 'Chưa bắt đầu', color: 'bg-gray-100 border-gray-500 text-gray-800' };
    }
  };

  const status = getStatusDisplay();
  
  const isPaused = driverStatus === 'paused';
  const isInProgress = driverStatus === 'in_progress';
  
  const passedStopsCount = isPaused ? currentStopIndex : currentStopIndex + 1;
  const passedStops = stops.slice(0, passedStopsCount).map(s => s.name);
  
  const currentStopName = isPaused 
    ? stops[currentStopIndex]?.name
    : (isInProgress && stops[currentStopIndex + 1] 
        ? `Đang tới ${stops[currentStopIndex + 1].name}` 
        : 'Hoàn thành');

  return (
    <div className={`p-6 rounded-lg shadow-md border-l-4 ${status.color}`}>
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-8">
        <div className="md:flex-1">
          <h2 className="text-xl font-bold mb-4">Trạng thái chuyến đi</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Trạng thái:</strong> {status.text}</p>
            {nextStop && <p><strong>Trạm kế tiếp:</strong> {nextStop.name}</p>}
          </div>
        </div>

        <div className="md:flex-1">
          <h3 className="font-semibold text-base mb-2">Các trạm đã qua:</h3>
          {passedStops.length > 0 ? (
            <ul className="list-disc list-inside mt-1 text-sm text-gray-700">
              {passedStops.map((stop, index) => (
                <li key={index}>{stop}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Chưa qua trạm nào</p>
          )}
        </div>

        <div className="md:flex-1 text-center">
          <div className="text-sm text-gray-500 font-medium">
            {isPaused ? 'Trạm hiện tại' : 'Vị trí'}
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {isPaused ? `${currentStopIndex + 1}/${stops.length}` : `${passedStopsCount}/${stops.length}`}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {currentStopName}
          </div>
        </div>
      </div>
    </div>
  );
}
