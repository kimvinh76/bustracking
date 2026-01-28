// Component hiển thị thông tin học sinh
export default function StudentInfoCard({ studentInfo, loading }) {
  if (loading) {
    return (
      <div className="bg-yellow-50 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Thông tin học sinh</h2>
        <p className="text-gray-500">Đang tải thông tin...</p>
      </div>
    );
  }

  if (!studentInfo) {
    return (
      <div className="bg-yellow-50 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Thông tin học sinh</h2>
        <p className="text-gray-500">Không có thông tin học sinh</p>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2">Thông tin học sinh</h2>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-gray-700">
        <p><strong>Họ và tên:</strong> {studentInfo.name}</p>
        <p><strong>Lớp:</strong> {studentInfo.class}</p>
        {studentInfo.phone && <p><strong>SĐT:</strong> {studentInfo.phone}</p>}
      </div>
    </div>
  );
}
