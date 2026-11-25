// Component hiển thị thông báo nổi (popup notification)
import { AlertTriangle, Users, UserX, Clock } from 'lucide-react';

const TOAST_CONFIG = {
  incident: {
    bg: 'bg-red-50 border-red-300',
    iconColor: 'text-red-600',
    Icon: AlertTriangle,
    title: 'Thông báo sự cố!',
  },
  absent: {
    bg: 'bg-red-50 border-red-300',
    iconColor: 'text-red-600',
    Icon: UserX,
    title: 'Học sinh vắng mặt',
  },
  waiting: {
    bg: 'bg-amber-50 border-amber-300',
    iconColor: 'text-amber-600',
    Icon: Clock,
    title: 'Cập nhật trạng thái đón',
  },
  pickup: {
    bg: 'bg-green-50 border-green-300',
    iconColor: 'text-green-600',
    Icon: Users,
    title: 'Đã đón học sinh!',
  },
};

export default function ToastNotification({ notification, onClose }) {
  const cfg = TOAST_CONFIG[notification.type] || TOAST_CONFIG.incident;
  const IconComponent = cfg.Icon;

  return (
    <div className={`p-4 rounded-lg shadow-lg border w-full animate-fade-in ${cfg.bg}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          <IconComponent className={`h-5 w-5 ${cfg.iconColor} mt-0.5 shrink-0`} />
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{cfg.title}</h4>
            <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
            <p className="text-xs text-gray-500 mt-2">
              Tuyến: {notification.route}
              {notification.driverName && ` | Tài xế: ${notification.driverName}`}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-2 cursor-pointer">
          ✕
        </button>
      </div>
    </div>
  );
}
