import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { schedulesService } from "../../services/schedulesService";
import Header from "../../components/admin/Header";
import { FiCalendar, FiUsers, FiPhone, FiX, FiMapPin } from 'react-icons/fi';

// Lấy driver ID từ sessionStorage (đã có sau khi login)
const getCurrentDriverId = async () => {
  try {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user?.driverId) {
      console.warn('User không có driverId. Vui lòng login lại.');
      return null;
    }

    return user.driverId; // Trả về driverId trực tiếp từ session
  } catch (error) {
    console.error('Lỗi khi lấy driver ID:', error);
    return null;
  }
};

export default function DriverScheduleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [showStopsModal, setShowStopsModal] = useState(false);
  const [currentDriverName, setCurrentDriverName] = useState("Tài xế");


  useEffect(() => {
    fetchScheduleDetail();
    fetchScheduleStops();
    // Load current logged-in user's display name (simple, from sessionStorage)
    try {
      const user = JSON.parse(sessionStorage.getItem('user')) || null;
      if (user) setCurrentDriverName(user.username || user.name || 'Tài xế');
    } catch (_) {
      // ignore
    }
  }, [id]);

  const fetchScheduleDetail = async () => {
    try {
      setLoading(true);

      console.log(' [DEBUG] Bắt đầu tải lịch làm việc, scheduleId:', id);

      const driverId = await getCurrentDriverId();
      console.log(' [DEBUG] Driver ID:', driverId);

      if (!driverId) {
        setError('Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.');
        console.error(' Không có driverId');
        return;
      }

      console.log(' [API CALL] Gọi schedulesService.getScheduleById:', { id, driverId });
      const response = await schedulesService.getScheduleById(id, driverId);
      console.log(' [API RESPONSE] Schedule data nhận được:', response);

      const scheduleData = Array.isArray(response) ? response[0] : response;

      // Normalize: Convert camelCase từ API sang snake_case cho frontend
      const normalizedSchedule = {
        ...scheduleData,
        // Map các field camelCase sang snake_case
        route_name: scheduleData.routeName || scheduleData.route_name || '',
        driver_name: scheduleData.driverName || scheduleData.driver_name || 'Tài xế',
        license_plate: scheduleData.licensePlate || scheduleData.license_plate || scheduleData.busNumber || '',
        scheduled_start_time: scheduleData.scheduledStartTime || scheduleData.scheduled_start_time || scheduleData.startTime || '',
        scheduled_end_time: scheduleData.scheduledEndTime || scheduleData.scheduled_end_time || scheduleData.endTime || '',
        shift_type: scheduleData.shiftType || scheduleData.shift_type || 'morning',
        date: scheduleData.date || new Date().toISOString().split('T')[0],
        start_point: scheduleData.startPoint || scheduleData.start_point || 'Không xác định',
        end_point: scheduleData.endPoint || scheduleData.end_point || 'Không xác định',
        max_capacity: scheduleData.maxCapacity || scheduleData.max_capacity || 30,
        // Giữ nguyên các field khác
        students: scheduleData.students || [],
      };

      console.log(' [PROCESSED] Schedule data sau xử lý:', normalizedSchedule);
      console.log(' [FIELDS CHECK]:', {
        route_name: normalizedSchedule.route_name,
        driver_name: normalizedSchedule.driver_name,
        license_plate: normalizedSchedule.license_plate,
        date: normalizedSchedule.date,
        scheduled_start_time: normalizedSchedule.scheduled_start_time,
        scheduled_end_time: normalizedSchedule.scheduled_end_time,
        start_point: normalizedSchedule.start_point,
        end_point: normalizedSchedule.end_point,
        students: normalizedSchedule.students?.length || 0
      });

      setSchedule(normalizedSchedule || null);
      setError(null);
    } catch (err) {
      setError('Lỗi khi tải chi tiết lịch làm việc: ' + err.message);
      console.error(' [ERROR] Lỗi khi fetch schedule:', err);
      console.error(' [ERROR DETAIL]:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      setSchedule(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduleStops = async () => {
    try {
      console.log(' [DEBUG] Bắt đầu tải điểm dừng, scheduleId:', id);

      const driverId = await getCurrentDriverId();
      console.log(' [DEBUG] Driver ID cho stops:', driverId);

      if (!driverId) {
        console.error(' Không có driverId cho stops');
        setStops([]);
        return;
      }

      console.log(' [API CALL] Gọi schedulesService.getScheduleStops:', { driverId, id });
      const stopsData = await schedulesService.getScheduleStops(driverId, id);
      console.log(' [API RESPONSE] Stops data nhận được:', stopsData);

      const stopsArray = stopsData?.stops || [];

      // Normalize stops: đảm bảo các field có sẵn và đúng format
      const normalizedStops = stopsArray.map((stop, index) => ({
        ...stop,
        id: stop.id || stop.stopId || index,
        name: stop.name || stop.stopName || `Điểm dừng ${index + 1}`,
        address: stop.address || stop.stopAddress || 'Chưa có địa chỉ',
        type: stop.type || stop.stopType || (stop.order === 0 ? 'Xuất phát' : stop.order === 99 ? 'Kết thúc' : 'Trung gian'),
        order: stop.order !== undefined ? stop.order : index,
      }));

      console.log(' [PROCESSED] Stops array:', normalizedStops);
      console.log(' [STOPS COUNT]:', normalizedStops.length);

      if (normalizedStops.length > 0) {
        console.log(' [FIRST STOP SAMPLE]:', normalizedStops[0]);
        console.log(' [STOPS FIELDS CHECK]:', {
          hasId: normalizedStops[0]?.id !== undefined,
          hasName: normalizedStops[0]?.name !== undefined,
          hasAddress: normalizedStops[0]?.address !== undefined,
          hasType: normalizedStops[0]?.type !== undefined,
          hasOrder: normalizedStops[0]?.order !== undefined
        });
      }

      setStops(normalizedStops);
    } catch (err) {
      console.error(' [ERROR] Lỗi khi fetch stops:', err);
      console.error(' [ERROR DETAIL]:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      setStops([]);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50/30">
        <Header title="CHI TIẾT LỊCH LÀM VIỆC" name={schedule?.driver_name || currentDriverName} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D8E359] border-t-[#174D2C] mx-auto mb-4"></div>
            <p className="text-[#174D2C] font-medium">Đang tải chi tiết lịch làm việc...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50/30">
        <Header title="CHI TIẾT LỊCH LÀM VIỆC" name={schedule?.driver_name || currentDriverName} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center text-red-600">
            <div className="text-6xl mb-4"></div>
            <p className="mb-4 text-lg">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-[#174D2C] text-white rounded-lg hover:bg-[#2a5d42] transition-colors"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50/30">
        <Header title="CHI TIẾT LỊCH LÀM VIỆC" name={schedule?.driver_name || currentDriverName} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="mb-4 flex justify-center"><FiCalendar className="w-12 h-12" aria-hidden="true" /></div>
            <p className="text-slate-500 text-lg">Không tìm thấy thông tin lịch làm việc</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-green-50/30">
      <Header title="CHI TIẾT LỊCH LÀM VIỆC" name={schedule?.driver_name || currentDriverName} />

      <div className="flex-1 overflow-y-auto w-full px-6 py-4">
        {/* Thông tin chuyến - Card chính */}
        <div className="bg-white rounded-xl shadow-lg border border-[#D8E359]/20 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#174D2C] mb-2">
                Chi tiết chuyến {id}
              </h1>
              <p className="text-slate-600">
                {schedule.route_name} •
                {schedule.scheduled_start_time?.substring(0, 5)} –
                {schedule.scheduled_end_time?.substring(0, 5)}
              </p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              ← Quay lại
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-slate-600 font-medium min-w-[120px]">Mã chuyến:</span>
                <span className="font-bold text-lg text-[#174D2C]">{id}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-600 font-medium min-w-[120px]">Ngày:</span>
                <span className="font-semibold text-slate-900">
                  {schedule.date ?
                    (() => {
                      const [year, month, day] = schedule.date.split('-');
                      return `${day}/${month}/${year}`;
                    })()
                    : 'Chưa có thông tin'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-600 font-medium min-w-[120px]">Ca:</span>
                <span className="font-bold text-xl text-[#174D2C]">
                  {(() => {
                    // Xác định loại ca dựa trên shift_type
                    if (schedule.shift_type) {
                      const shiftTypeText = schedule.shift_type === 'morning' ? 'Sáng' :
                        schedule.shift_type === 'afternoon' ? 'Chiều' : 'Tối';

                      return `Ca ${shiftTypeText}`;
                    } else {

                      const startHour = schedule.start_time ? parseInt(schedule.start_time.split(':')[0]) : 0;

                      let shiftTypeText = '';
                      if (startHour >= 6 && startHour < 12) {
                        shiftTypeText = 'Sáng';
                      } else if (startHour >= 12 && startHour < 18) {
                        shiftTypeText = 'Chiều';
                      } else {
                        shiftTypeText = 'Tối';
                      }
                      return `Ca ${shiftTypeText}`;
                    }
                  })()}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-600 font-medium min-w-[120px]">Giờ dự kiến:</span>
                <span className="font-bold text-lg text-slate-900">
                  {schedule.scheduled_start_time?.substring(0, 5)} – {schedule.scheduled_end_time?.substring(0, 5)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-600 font-medium min-w-[120px]">Giờ thực tế:</span>
                <span className="font-bold text-lg text-green-700">
                  {(() => {
                    const renderTime = (t) => {
                      if (!t) return '--:--';
                      try {
                        const d = new Date(t);
                        if (!isNaN(d.getTime())) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                        return String(t).substring(11, 16);
                      } catch { return '--:--'; }
                    };
                    const start = renderTime(schedule.actual_start_time);
                    const end = renderTime(schedule.actual_end_time);
                    if (start === '--:--' && end === '--:--') return 'Chưa chạy';
                    return `${start} – ${end}`;
                  })()}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-600 font-medium min-w-[120px]">Tuyến đường:</span>
                <span className="font-semibold text-slate-900">{schedule.route_name}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-slate-600 font-medium min-w-[120px]">Xe buýt:</span>
                <span className="font-mono font-bold text-lg bg-[#D8E359]/20 px-3 py-2 rounded text-[#174D2C]">
                  {schedule.license_plate}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-slate-600 font-medium min-w-[120px]">Học sinh:</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">
                    {schedule.students?.length || 0}/{schedule.max_capacity}
                  </span>
                  <button
                    onClick={() => setShowStudentsModal(true)}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Xem danh sách
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-600 font-medium min-w-[120px]">Điểm dừng:</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">
                    {stops.length} điểm
                  </span>
                  <button
                    onClick={() => setShowStopsModal(true)}
                    className="inline-flex items-center px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Xem danh sách
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Modal danh sách học sinh */}
        {showStudentsModal && (
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          // onClick={(e) => e.target === e.currentTarget && setShowStudentsModal(false)}
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-[#174D2C] to-[#1a5530] text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <FiUsers className="w-6 h-6" aria-hidden="true" /> Danh sách học sinh
                    </h2>
                    <p className="text-green-100 mt-1">
                      Chuyến {id} - {schedule.students?.length || 0} học sinh
                    </p>
                  </div>
                  <button
                    onClick={() => setShowStudentsModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors group"
                    aria-label="Đóng"
                  >
                    <FiX className="w-5 h-5 group-hover:scale-110 transition-transform" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="overflow-auto max-h-[calc(90vh-120px)]">
                <table className="w-full">
                  <thead className="sticky top-0 bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">STT</th>
                      <th className="px-6 py-4 text-left font-semibold">HỌ TÊN</th>
                      <th className="px-6 py-4 text-left font-semibold">LỚP</th>

                      <th className="px-6 py-4 text-left font-semibold">PHỤ HUYNH</th>
                      <th className="px-6 py-4 text-left font-semibold">LIÊN HỆ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {!schedule.students || schedule.students.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center">
                          <div className="text-6xl mb-4"></div>
                          <p className="text-slate-500 text-lg">Chưa có học sinh được phân công cho chuyến này</p>
                          <p className="text-slate-400 text-sm mt-2">Vui lòng liên hệ quản trị viên để cập nhật danh sách</p>
                        </td>
                      </tr>
                    ) : schedule.students.map((student, index) => (
                      <tr
                        key={student.id}
                        className={`hover:bg-slate-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                          }`}
                      >
                        <td className="px-6 py-4 font-bold text-slate-900 text-lg text-center">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{student.name}</div>
                          <div className="text-sm text-slate-500">ID: {student.id}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                            {student.class} - Khối {student.grade}
                          </span>
                        </td>


                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">
                            {student.parent_name || 'Chưa có thông tin'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono text-slate-900 mb-1">
                            {student.parent_phone || student.phone || 'Chưa có'}
                          </div>
                          {(student.parent_phone || student.phone) && (
                            <button
                              className="text-sm bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-lg transition-colors flex items-center gap-2"
                              onClick={() => window.open(`tel:${student.parent_phone || student.phone}`)}
                              aria-label={`Gọi ${student.parent_name || student.name}`}
                            >
                              <FiPhone className="w-4 h-4" aria-hidden="true" />
                              <span>Gọi ngay</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>


            </div>
          </div>
        )}

        {/* Modal danh sách điểm dừng */}
        {showStopsModal && (
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-[#174D2C] to-[#1a5530] text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <FiMapPin className="w-6 h-6" aria-hidden="true" /> Danh sách điểm dừng
                    </h2>
                    <p className="text-green-100 mt-1">
                      Tuyến {schedule.route_name} - {stops.length} điểm dừng
                    </p>
                  </div>
                  <button
                    onClick={() => setShowStopsModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors group"
                    aria-label="Đóng"
                  >
                    <FiX className="w-5 h-5 group-hover:scale-110 transition-transform" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="overflow-auto max-h-[calc(90vh-120px)]">
                <table className="w-full">
                  <thead className="sticky top-0 bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-6 py-4 text-center font-semibold">STT</th>
                      <th className="px-6 py-4 text-left font-semibold">TÊN ĐIỂM DỪNG</th>
                      <th className="px-6 py-4 text-left font-semibold">ĐỊA CHỈ</th>
                      <th className="px-6 py-4 text-center font-semibold">LOẠI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stops.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center">
                          <div className="text-6xl mb-4">📍</div>
                          <p className="text-slate-500 text-lg">Chưa có thông tin điểm dừng cho tuyến này</p>
                          <p className="text-slate-400 text-sm mt-2">Vui lòng liên hệ quản trị viên để cập nhật</p>
                        </td>
                      </tr>
                    ) : stops.map((stop, index) => (
                      <tr
                        key={`${stop.id || stop.order}-${index}`}
                        className={`hover:bg-slate-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                          }`}
                      >
                        <td className="px-6 py-4 font-bold text-slate-900 text-lg text-center">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{stop.name || 'Chưa có tên'}</div>
                          {stop.id && <div className="text-sm text-slate-500 mt-1">ID: {stop.id}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-700">
                            {stop.address || 'Chưa có địa chỉ'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${stop.order === 0 || stop.type?.toLowerCase().includes('xuất phát') || stop.type?.toLowerCase().includes('start')
                            ? 'bg-green-100 text-green-700' :
                            stop.order === 99 || stop.type?.toLowerCase().includes('kết thúc') || stop.type?.toLowerCase().includes('end')
                              ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                            {stop.type || (stop.order === 0 ? 'Xuất phát' : stop.order === 99 ? 'Kết thúc' : 'Trung gian')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}