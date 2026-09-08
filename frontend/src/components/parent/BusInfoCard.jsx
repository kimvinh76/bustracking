// Component hiển thị thông tin xe buýt và tài xế
export default function BusInfoCard({ busInfo, loading }) {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Thông tin xe buýt</h2>
        <p className="text-gray-500">Đang tải thông tin...</p>
      </div>
    );
  }

  if (!busInfo) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Thông tin xe buýt</h2>
        <p className="text-gray-500">Chưa có chuyến xe đang chạy</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2">Thông tin xe buýt</h2>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-gray-700">
        <p><strong>Số xe:</strong> {busInfo.busNumber}</p>
        <p><strong>Tuyến đường:</strong> {busInfo.route}</p>
        <p><strong>Tài xế:</strong> {busInfo.driverName}</p>
        {busInfo.driverPhone && busInfo.driverPhone !== 'N/A' && (
          <p>
            <strong>SĐT Tài xế:</strong>{' '}
            <a href={`tel:${busInfo.driverPhone}`} className="text-blue-600 hover:underline">
              {busInfo.driverPhone}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
