/**
 * ParentOverviewPage - Trang tổng quan cho phụ huynh
 *
 * Mục tiêu (tối giản):
 * - Hiển thị thông tin cơ bản của học sinh
 * - Hiển thị toàn bộ lịch trình thuộc các tuyến được gán (morning_route_id + afternoon_route_id)
 *
 * Lưu ý:
 * - Trang này KHÔNG realtime tracking, chỉ để xem tổng quan.
 */

import { useEffect, useMemo, useState } from 'react';

import { studentsService } from '../../services/studentsService';
import { schedulesService } from '../../services/schedulesService';

import { StudentInfoCard } from '../../components/parent';

export default function ParentOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState(null);
  const [assignedRouteIds, setAssignedRouteIds] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const toNumber = (v) => {
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user) {
          setStudentInfo({ name: 'Chưa đăng nhập', class: 'N/A', phone: null });
          return;
        }

        // 2 tuyến được gán cho học sinh
        const routes = [user?.morning_route_id, user?.afternoon_route_id]
          .filter(Boolean)
          .map((id) => Number(id))
          .filter((id) => !Number.isNaN(id));
        setAssignedRouteIds(routes);

        // Student basic info
        if (user.student_id) {
          const studentData = await studentsService.getStudentById(user.student_id);
          setStudentInfo({
            name: studentData.name,
            class: studentData.class_name || studentData.class || 'N/A',
            phone: studentData.phone
          });
        } else if (user.student_name) {
          setStudentInfo({ name: user.student_name, class: 'N/A', phone: null });
        } else {
          setStudentInfo({ name: 'Không có dữ liệu', class: 'N/A', phone: null });
        }

        // Schedules overview (lọc theo tuyến được gán)
        const allSchedules = await schedulesService.getAllSchedules();
        const filtered = (allSchedules || []).filter((s) => {
          const rid = toNumber(s?.route_id);
          return rid != null && routes.includes(rid);
        });

        // Sort: mới nhất trước
        filtered.sort((a, b) => {
          const da = new Date(a?.date || 0).getTime();
          const db = new Date(b?.date || 0).getTime();
          if (db !== da) return db - da;
          return String(b?.start_time || '').localeCompare(String(a?.start_time || ''));
        });

        setSchedules(filtered);
      } catch (err) {
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const title = useMemo(() => {
    if (!assignedRouteIds || assignedRouteIds.length === 0) return 'Tổng quan lịch trình';
    return `Tổng quan lịch trình (tuyến: ${assignedRouteIds.join(', ')})`;
  }, [assignedRouteIds]);

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">{title}</h1>

      {/* Thông tin học sinh */}
      <StudentInfoCard studentInfo={studentInfo} loading={loading} />

      {/* Danh sách lịch trình */}
      <div className="bg-white p-6 rounded-lg shadow-md mt-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Danh sách lịch trình</h2>

        {loading ? (
          <p className="text-gray-600">Đang tải...</p>
        ) : schedules.length === 0 ? (
          <p className="text-gray-600">Không có lịch trình cho các tuyến được gán.</p>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-gray-700 border-b">
                <tr>
                  <th className="py-2 pr-4">Ngày</th>
                  <th className="py-2 pr-4">Tuyến</th>
                  <th className="py-2 pr-4">Giờ</th>
                  <th className="py-2 pr-4">Xe</th>
                  <th className="py-2 pr-4">Tài xế</th>
                  <th className="py-2 pr-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="text-gray-800">
                {schedules.map((s) => (
                  <tr key={s.id} className="border-b last:border-b-0">
                    <td className="py-2 pr-4 whitespace-nowrap">{s.date || 'N/A'}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {s.route_name || (s.route_id ? `Tuyến ${s.route_id}` : 'N/A')}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {(s.start_time || 'N/A') + ' - ' + (s.end_time || 'N/A')}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">{s.license_plate || s.bus_number || 'N/A'}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{s.driver_name || 'N/A'}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{s.status || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
