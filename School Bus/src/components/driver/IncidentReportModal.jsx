import React from 'react';
import { AlertTriangle, X, Send } from "lucide-react";
import { incidentsService } from '../../services/incidentsService.js';

export default function IncidentReportModal({
  isOpen,
  incidentText,
  onIncidentTextChange,
  onSubmit,
  onClose,
  driverInfo = {}, // { id, busId, routeId }
  currentPosition = null, // { lat, lng }
}) {
  const [severity, setSeverity] = React.useState('medium');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  if (!isOpen) return null;

  const quickOptions = [
    { text: "🚗 Xe hỏng", value: "Xe gặp sự cố kỹ thuật", type: "vehicle", severity: "high" },
    { text: "🚦 Kẹt xe", value: "Giao thông kẹt xe nghiêm trọng", type: "traffic", severity: "medium" },
    { text: "👤 HS không đến", value: "Học sinh không có mặt tại điểm đón", type: "student", severity: "low" },
    { text: "⚠️ Khẩn cấp", value: "Tình huống khẩn cấp cần hỗ trợ ngay", type: "emergency", severity: "high" },
    { text: "🌧️ Thời tiết xấu", value: "Thời tiết không thuận lợi ảnh hưởng lộ trình", type: "weather", severity: "medium" },
    { text: "🚸 An toàn HS", value: "Vấn đề an toàn học sinh", type: "safety", severity: "high" },
  ];

  const severityOptions = [
    { value: 'low', label: 'Thấp', color: 'text-green-600 bg-green-50' },
    { value: 'medium', label: 'Trung bình', color: 'text-yellow-600 bg-yellow-50' },
    { value: 'high', label: 'Cao', color: 'text-red-600 bg-red-50' },
  ];

  const handleQuickSelect = (option) => {
    onIncidentTextChange(option.value);
    setSeverity(option.severity);
  };

  const handleSubmit = async () => {
    if (!incidentText.trim()) {
      alert('Vui lòng mô tả sự cố');
      return;
    }

    setIsSubmitting(true);
    try {
      const incidentData = {
        driver_id: driverInfo.id,
        bus_id: driverInfo.busId,
        route_id: driverInfo.routeId,
        incident_type: quickOptions.find(opt => opt.value === incidentText)?.type || 'other',
        description: incidentText,
        latitude: currentPosition?.lat,
        longitude: currentPosition?.lng,
        severity
      };

      console.log('Gửi dữ liệu:', incidentData);
      const result = await incidentsService.createIncident(incidentData);
      console.log('Nhận response:', result);
      
      if (result && result.success) {
        onSubmit(result.incident); // Pass back the created incident
        onClose();
        alert(' Báo cáo sự cố đã được gửi thành công!');
      } else {
        console.error('Response không có success:', result);
        throw new Error(result?.message || 'Không thể gửi báo cáo');
      }
    } catch (error) {
      console.error('Lỗi gửi báo cáo sự cố:', error);
      alert('Lỗi gửi báo cáo: ' + (error.message || 'Vui lòng thử lại'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-70">
      <div className="bg-white rounded-xl p-6 max-w-md mx-4 w-full border shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Báo cáo sự cố
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Severity selector */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Mức độ nghiêm trọng:</p>
          <div className="flex gap-2">
            {severityOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSeverity(option.value)}
                className={`px-3 py-2 text-xs rounded-full border transition-colors ${
                  severity === option.value 
                    ? option.color + ' border-current'
                    : 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick incident options */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">Chọn nhanh loại sự cố:</p>
          <div className="grid grid-cols-2 gap-2">
            {quickOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => handleQuickSelect(option)}
                className="p-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-red-300 transition-colors text-left"
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={incidentText}
          onChange={(e) => onIncidentTextChange(e.target.value)}
          placeholder="Mô tả chi tiết tình huống sự cố (vị trí, mức độ nghiêm trọng...)"
          className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 mb-4 focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!incidentText.trim() || isSubmitting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Gửi báo cáo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
