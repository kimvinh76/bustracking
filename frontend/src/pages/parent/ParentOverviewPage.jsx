/**
 * ParentOverviewPage - Xem lịch trình đưa đón theo từng con của phụ huynh
 */

import { useEffect, useMemo, useState } from 'react';
import { parentsService } from '../../services/parentsService';
import { studentsService } from '../../services/studentsService';
import { schedulesService } from '../../services/schedulesService';
import { formatDateVi, formatTimeShortVi } from '../../utils/dateFormat';
import { StudentInfoCard } from '../../components/parent';

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export default function ParentOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [allSchedules, setAllSchedules] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user) {
          setChildren([]);
          return;
        }

        let list = user.id ? await parentsService.getChildrenByUserId(user.id) : [];
        if ((!list || list.length === 0) && user.student_id) {
          const stu = await studentsService.getStudentById(user.student_id);
          if (stu) {
            const morningSub = stu.subscriptions?.find((s) => s.shift_type === 'morning');
            const afternoonSub = stu.subscriptions?.find((s) => s.shift_type === 'afternoon');
            list = [
              {
                ...stu,
                morning_route_id: morningSub?.route_id ?? user.morning_route_id ?? null,
                morning_route_name: morningSub?.route_name ?? null,
                morning_stop_name: morningSub?.stop_name ?? null,
                afternoon_route_id: afternoonSub?.route_id ?? user.afternoon_route_id ?? null,
                afternoon_route_name: afternoonSub?.route_name ?? null,
                afternoon_stop_name: afternoonSub?.stop_name ?? null,
              },
            ];
          }
        }

        const safeList = Array.isArray(list) ? list : [];
        setChildren(safeList);
        if (safeList.length > 0) {
          setSelectedChildId(safeList[0].id);
        }

        const schedulesRes = await schedulesService.getAllSchedules();
        setAllSchedules(Array.isArray(schedulesRes) ? schedulesRes : []);
      } catch {
        setAllSchedules([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const selectedChild = useMemo(
    () =>
      children.find((c) => String(c.id) === String(selectedChildId)) ||
      children[0] ||
      null,
    [children, selectedChildId]
  );

  const studentInfo = useMemo(() => {
    if (!selectedChild) return null;
    return {
      name: selectedChild.name,
      class: selectedChild.class_name || selectedChild.class || 'N/A',
      grade: selectedChild.grade,
      phone: selectedChild.phone,
      morning_route_name: selectedChild.morning_route_name,
      morning_stop_name: selectedChild.morning_stop_name,
      afternoon_route_name: selectedChild.afternoon_route_name,
      afternoon_stop_name: selectedChild.afternoon_stop_name,
    };
  }, [selectedChild]);

  const assignedRouteIds = useMemo(() => {
    if (!selectedChild) return [];
    return [selectedChild.morning_route_id, selectedChild.afternoon_route_id]
      .map(toNumber)
      .filter((id, idx, arr) => id !== null && arr.indexOf(id) === idx);
  }, [selectedChild]);

  const schedules = useMemo(() => {
    const filtered = allSchedules.filter((s) => {
      const rid = toNumber(s?.route_id);
      if (rid == null || !assignedRouteIds.includes(rid)) return false;
      if (statusFilter && s.status !== statusFilter) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      const da = new Date(a?.date || 0).getTime();
      const db = new Date(b?.date || 0).getTime();
      if (db !== da) return db - da;
      return String(b?.start_time || '').localeCompare(String(a?.start_time || ''));
    });
  }, [allSchedules, assignedRouteIds, statusFilter]);

  return (
    <div className="p-4 md:p-6 bg-gray-100 min-h-screen space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#174D2C]">
          Lịch trình đưa đón
        </h1>

        {children.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">Chọn con:</span>
            {children.map((child) => {
              const active = String(child.id) === String(selectedChild?.id);
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => setSelectedChildId(child.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                    active
                      ? 'bg-[#174D2C] text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {child.name} ({child.class_name || child.class || 'N/A'})
                </button>
              );
            })}
          </div>
        )}
      </div>

      <StudentInfoCard studentInfo={studentInfo} loading={loading} />

      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-gray-800">
            Danh sách lịch trình ({schedules.length})
          </h2>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="scheduled">Chưa bắt đầu</option>
            <option value="in_progress">Đang chạy</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-gray-600">Đang tải...</p>
        ) : schedules.length === 0 ? (
          <p className="text-sm text-gray-600">
            Không có lịch trình phù hợp cho tuyến của học sinh này.
          </p>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-gray-700 border-b bg-gray-50">
                <tr>
                  <th className="py-2.5 px-3">Ngày</th>
                  <th className="py-2.5 px-3">Tuyến</th>
                  <th className="py-2.5 px-3">Ca</th>
                  <th className="py-2.5 px-3">Giờ dự kiến</th>
                  <th className="py-2.5 px-3">Xe</th>
                  <th className="py-2.5 px-3">Tài xế</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="text-gray-800 divide-y divide-gray-100">
                {schedules.map((s) => {
                  const statusMeta =
                    s.status === 'completed'
                      ? { label: 'Hoàn thành', cls: 'bg-green-100 text-green-700' }
                      : s.status === 'in_progress'
                        ? { label: 'Đang chạy', cls: 'bg-blue-100 text-blue-700' }
                        : s.status === 'cancelled'
                          ? { label: 'Đã hủy', cls: 'bg-red-100 text-red-700' }
                          : { label: 'Chưa bắt đầu', cls: 'bg-slate-100 text-slate-700' };
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {formatDateVi(s.date, undefined, 'N/A')}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium">
                        {s.route_name || (s.route_id ? `Tuyến ${s.route_id}` : 'N/A')}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {s.shift_type === 'afternoon' ? 'Ca chiều' : 'Ca sáng'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {`${formatTimeShortVi(s.start_time, '--:--')} - ${formatTimeShortVi(s.end_time, '--:--')}`}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {s.license_plate || s.bus_number || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {s.driver_name || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusMeta.cls}`}
                        >
                          {statusMeta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
