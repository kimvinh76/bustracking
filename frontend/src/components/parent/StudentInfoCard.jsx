// Component hiển thị thông tin học sinh + tuyến/điểm đón trả & trạng thái lên/xuống xe
export default function StudentInfoCard({ studentInfo, loading, boardingBadge = null }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-[#174D2C] mb-3 border-b pb-2">
          Thông tin học sinh
        </h2>
        <p className="text-sm text-gray-500">Đang tải thông tin...</p>
      </div>
    );
  }

  if (!studentInfo) {
    return (
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-[#174D2C] mb-3 border-b pb-2">
          Thông tin học sinh
        </h2>
        <p className="text-sm text-gray-500">Không có thông tin học sinh</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b pb-2.5">
        <h2 className="text-lg font-bold text-[#174D2C]">Thông tin học sinh</h2>
        {boardingBadge && (
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${boardingBadge.className}`}
          >
            {boardingBadge.label}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-700">
        <div>
          <span className="text-gray-500">Họ và tên: </span>
          <strong className="text-gray-900">{studentInfo.name}</strong>
        </div>
        <div>
          <span className="text-gray-500">Lớp: </span>
          <strong className="text-gray-900">
            {studentInfo.class}
            {studentInfo.grade ? ` (Khối ${studentInfo.grade})` : ''}
          </strong>
        </div>
        {studentInfo.phone && (
          <div>
            <span className="text-gray-500">SĐT: </span>
            <strong className="text-gray-900">{studentInfo.phone}</strong>
          </div>
        )}
      </div>

      {(studentInfo.morning_route_name || studentInfo.afternoon_route_name) && (
        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-gray-600">
          <div className="bg-sky-50/70 border border-sky-100 rounded-lg px-3 py-2">
            <span className="font-semibold text-sky-900">Ca sáng: </span>
            <span>{studentInfo.morning_route_name || 'Chưa đăng ký'}</span>
            {studentInfo.morning_stop_name && (
              <span className="text-sky-700"> · Đón tại: {studentInfo.morning_stop_name}</span>
            )}
          </div>
          <div className="bg-amber-50/70 border border-amber-100 rounded-lg px-3 py-2">
            <span className="font-semibold text-amber-900">Ca chiều: </span>
            <span>{studentInfo.afternoon_route_name || 'Chưa đăng ký'}</span>
            {studentInfo.afternoon_stop_name && (
              <span className="text-amber-700"> · Trả tại: {studentInfo.afternoon_stop_name}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
