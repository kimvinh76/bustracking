// Component hiển thị thông báo nổi (popup notification)
import { AlertTriangle, Users } from 'lucide-react';

export default function ToastNotification({ notification, onClose }) {
  // Xác định màu sắc dựa trên loại thông báo
  const bgColor = notification.type === 'incident' 
    ? 'bg-red-50 border-red-300' 
    : notification.type === 'pickup' 
    ? 'bg-green-50 border-green-300' 
    : 'bg-blue-50 border-blue-300';

  const IconComponent = notification.type === 'pickup' ? Users : AlertTriangle;
  const iconColor = notification.type === 'pickup' ? 'text-green-600' : 'text-red-600';
  const title = notification.type === 'pickup' ? 'Đã đón học sinh!' : 'Thông báo sự cố!';

  return (
    <div className={`fixed top-4 right-4 z-[9999] p-4 rounded-lg shadow-lg border max-w-sm animate-fade-in ${bgColor}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          <IconComponent className={`h-5 w-5 ${iconColor} mt-0.5`} />
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{title}</h4>
            <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
            <p className="text-xs text-gray-500 mt-2">
              Tuyến: {notification.route}
              {notification.driverName && ` | Tài xế: ${notification.driverName}`}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-2">
          ✕
        </button>
      </div>
    </div>
  );
}
