// Component hiển thị chi tiết một sự cố
import { Car, AlertTriangle, Users, PhoneCall, Info } from 'lucide-react';

// Map loại sự cố sang tiếng Việt
const INCIDENT_TYPE_LABELS = {
  traffic: 'Giao thông',
  vehicle: 'Phương tiện',
  student: 'Học sinh',
  emergency: 'Khẩn cấp'
};

// Map độ nghiêm trọng sang tiếng Việt và màu sắc
const SEVERITY_CONFIG = {
  high: { label: 'Cao', bgClass: 'bg-red-100 text-red-700', borderClass: 'border-red-300 bg-red-50' },
  medium: { label: 'Trung bình', bgClass: 'bg-yellow-100 text-yellow-700', borderClass: 'border-yellow-300 bg-yellow-50' },
  low: { label: 'Thấp', bgClass: 'bg-blue-100 text-blue-700', borderClass: 'border-blue-300 bg-blue-50' }
};

// Map icon theo loại sự cố
const getIncidentIcon = (type) => {
  const icons = {
    traffic: Car,
    vehicle: AlertTriangle,
    student: Users,
    emergency: PhoneCall
  };
  return icons[type] || Info;
};

export default function IncidentCard({ incident }) {
  const severityConfig = SEVERITY_CONFIG[incident.severity] || SEVERITY_CONFIG.low;
  const IconComponent = getIncidentIcon(incident.incident_type);
  const typeLabel = INCIDENT_TYPE_LABELS[incident.incident_type] || 'Khác';

  return (
    <div className={`p-4 rounded-lg border mb-3 ${severityConfig.borderClass}`}>
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className={`p-2 rounded-full ${severityConfig.bgClass.split(' ')[0]}`}>
          <IconComponent className="h-5 w-5 text-gray-600" />
        </div>
        
        {/* Content */}
        <div className="flex-1">
          {/* Header: Type + Severity */}
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-medium text-gray-900">{typeLabel}</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityConfig.bgClass}`}>
              {severityConfig.label}
            </span>
          </div>
          
          {/* Description */}
          <p className="text-gray-700 text-sm mb-2">{incident.description}</p>
          
          {/* Footer: Route + Time */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Tuyến: {incident.route_name || `Route ${incident.route_id}`}</span>
            <span>{new Date(incident.created_at).toLocaleString('vi-VN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
