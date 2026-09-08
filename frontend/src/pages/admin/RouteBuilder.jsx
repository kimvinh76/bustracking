import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, Save, MapPin, GripVertical, Trash2 } from 'lucide-react';

import apiClient from '../../services/api';
import Header from '../../components/admin/Header';
import Button from '../../components/common/Button';
import boxDialog from '../../components/UI/BoxDialog';

// Fix leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const defaultIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const selectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const schoolIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Sortable Item Component
function SortableStopItem({ id, stop, index, onRemove, isFixed }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: id, disabled: isFixed });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 mb-2 rounded-lg border ${isFixed ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200 shadow-sm'} `}
    >
      <div 
        {...(isFixed ? {} : listeners)} 
        {...(isFixed ? {} : attributes)}
        className={`${isFixed ? 'text-gray-300' : 'cursor-grab text-gray-500 hover:text-gray-700'}`}
      >
        <GripVertical size={20} />
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
            {index + 1}
          </span>
          <p className="font-medium text-gray-800 text-sm truncate">{stop.name}</p>
        </div>
        <p className="text-xs text-gray-500 truncate mt-1">{stop.address}</p>
      </div>

      {!isFixed && (
        <button
          onClick={() => onRemove(stop)}
          className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
          title="Xóa khỏi tuyến"
        >
          <Trash2 size={18} />
        </button>
      )}
      {isFixed && (
        <span className="text-xs font-bold text-red-600 px-2">CỐ ĐỊNH</span>
      )}
    </div>
  );
}

// Map center updater
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0]) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export default function RouteBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [route, setRoute] = useState(null);
  const [allStops, setAllStops] = useState([]);
  const [selectedStops, setSelectedStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mapCenter, setMapCenter] = useState([10.8231, 106.6297]); // TPHCM

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Lấy thông tin route
        const routeResponse = await apiClient.get(`/routes/${id}`);
        // Giả sử server trả về { success, data }
        const routeData = routeResponse.data || routeResponse;
        setRoute(routeData);

        // 2. Lấy danh sách tất cả stops
        const stopsResponse = await apiClient.get('/stops');
        const stopsData = stopsResponse.data || stopsResponse;
        setAllStops(stopsData);

        // 3. Lấy stops hiện tại của route
        const routeStopsResponse = await apiClient.get(`/routes/${id}/stops`);
        const routeStopsData = routeStopsResponse.data || routeStopsResponse;
        
        if (routeStopsData && routeStopsData.length > 0) {
           setSelectedStops(routeStopsData.sort((a,b) => a.stop_order - b.stop_order));
           setMapCenter([routeStopsData[0].latitude, routeStopsData[0].longitude]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        boxDialog("error", "Lỗi", "Không thể tải dữ liệu tuyến đường");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Kiểm tra xem 1 trạm có phải là Trường học không (Hardcode id 43 hoặc tên có chữ Nguyễn Du)
  const isSchoolStop = (stop) => {
    return stop.id === 43 || stop.stop_id === 43 || (stop.name && stop.name.toLowerCase().includes('nguyen du'));
  };

  // Tính toán danh sách Stops hiển thị an toàn với ràng buộc Trường
  // Nếu morning: Trường nằm cuối. Nếu afternoon: Trường nằm đầu
  const safeSelectedStops = useMemo(() => {
    if (!route) return selectedStops;
    
    let stops = [...selectedStops];
    const schoolStopIndex = stops.findIndex(isSchoolStop);
    
    if (schoolStopIndex !== -1) {
      const schoolStop = stops[schoolStopIndex];
      stops.splice(schoolStopIndex, 1);
      
      if (route.shift_type === 'morning') {
        stops.push(schoolStop); // Morning -> Cuối
      } else {
        stops.unshift(schoolStop); // Afternoon -> Đầu
      }
    }
    return stops;
  }, [selectedStops, route]);


  // Kéo thả
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setSelectedStops((items) => {
        const safeItems = [...safeSelectedStops];
        const oldIndex = safeItems.findIndex(item => (item.id || item.stop_id).toString() === active.id.toString());
        const newIndex = safeItems.findIndex(item => (item.id || item.stop_id).toString() === over.id.toString());
        
        if (oldIndex === -1 || newIndex === -1) return items;

        // Không cho đổi chỗ nếu trạm đó là fixed (trường)
        if (isSchoolStop(safeItems[oldIndex]) || isSchoolStop(safeItems[newIndex])) {
            return items;
        }

        return arrayMove(safeItems, oldIndex, newIndex);
      });
    }
  };

  // Click trên Map
  const toggleStopSelection = (stop) => {
    // Không cho tự bỏ chọn trạm trường
    if (isSchoolStop(stop)) {
        return;
    }

    const isSelected = safeSelectedStops.some(s => s.id === stop.id || s.stop_id === stop.id);
    
    if (isSelected) {
      setSelectedStops(safeSelectedStops.filter(s => s.id !== stop.id && s.stop_id !== stop.id));
    } else {
      setSelectedStops([...safeSelectedStops, {
          ...stop,
          stop_id: stop.id // format DB cần
      }]);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Định dạng lại data theo chuẩn API: [{stop_id, stop_order}]
      const payload = {
        stops: safeSelectedStops.map((s, idx) => ({
          stop_id: s.stop_id || s.id,
          stop_order: idx + 1
        }))
      };

      await apiClient.put(`/routes/${id}/stops`, payload);
      boxDialog("success", "Thành công", "Đã lưu danh sách trạm và tính lại khoảng cách!");
      navigate('/admin/routes');
    } catch (error) {
      console.error("Save error:", error);
      boxDialog("error", "Lỗi", "Không thể lưu danh sách trạm");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div></div>;
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin/routes')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <div>
                <h1 className="text-xl font-bold text-gray-800">Xếp Trạm Tuyến Đường</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Tuyến: <span className="font-semibold text-blue-600">{route?.route_name}</span> 
                    &nbsp;|&nbsp; 
                    Ca: <span className="font-semibold">{route?.shift_type === 'morning' ? 'Ca Sáng' : 'Ca Chiều'}</span>
                </p>
            </div>
        </div>
        <Button variant="primary" onClick={handleSave} loading={saving} disabled={saving} className="flex items-center gap-2">
            <Save size={20} />
            Lưu thay đổi
        </Button>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden min-h-[600px]">
        {/* Bản đồ bên trái */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative z-0">
          <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ChangeView center={mapCenter} zoom={13} />
            
            {allStops.map((stop) => {
              const isSchool = isSchoolStop(stop);
              const isSelected = safeSelectedStops.some(s => s.id === stop.id || s.stop_id === stop.id);
              
              let iconToUse = defaultIcon;
              if (isSchool) iconToUse = schoolIcon;
              else if (isSelected) iconToUse = selectedIcon;

              return (
                <Marker 
                  key={stop.id} 
                  position={[parseFloat(stop.latitude), parseFloat(stop.longitude)]}
                  icon={iconToUse}
                  eventHandlers={{
                    click: () => toggleStopSelection(stop),
                  }}
                >
                  <Popup>
                    <div className="font-medium">{stop.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{stop.address}</div>
                    {isSchool && <div className="text-xs text-red-600 font-bold mt-1">Điểm Trường (Cố định)</div>}
                    <button 
                        onClick={() => toggleStopSelection(stop)}
                        className={`mt-2 w-full text-xs py-1 rounded ${isSchool ? 'hidden' : (isSelected ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200')}`}
                    >
                        {isSelected ? 'Bỏ chọn khỏi tuyến' : 'Thêm vào tuyến'}
                    </button>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        </div>

        {/* Danh sách kéo thả bên phải */}
        <div className="w-[400px] flex flex-col bg-gray-50 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-white shadow-sm z-10">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                    <MapPin size={20} className="text-blue-500" />
                    Lộ trình tuyến ({safeSelectedStops.length} trạm)
                </h2>
                <p className="text-xs text-gray-500 mt-1">Kéo thả icon <GripVertical size={14} className="inline"/> để thay đổi thứ tự</p>
                {route?.shift_type === 'morning' ? (
                    <div className="text-xs bg-yellow-50 text-yellow-700 p-2 mt-2 rounded border border-yellow-200">
                        <b>Lưu ý:</b> Tuyến sáng luôn kết thúc tại Trường Nguyễn Du.
                    </div>
                ) : (
                    <div className="text-xs bg-yellow-50 text-yellow-700 p-2 mt-2 rounded border border-yellow-200">
                        <b>Lưu ý:</b> Tuyến chiều luôn xuất phát từ Trường Nguyễn Du.
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={safeSelectedStops.map(s => (s.id || s.stop_id).toString())}
                        strategy={verticalListSortingStrategy}
                    >
                        {safeSelectedStops.map((stop, index) => {
                            const stopIdentifier = (stop.id || stop.stop_id).toString();
                            const isSchool = isSchoolStop(stop);
                            
                            return (
                                <SortableStopItem 
                                    key={stopIdentifier} 
                                    id={stopIdentifier} 
                                    stop={stop}
                                    index={index}
                                    onRemove={toggleStopSelection}
                                    isFixed={isSchool}
                                />
                            );
                        })}
                    </SortableContext>
                </DndContext>

                {safeSelectedStops.length === 0 && (
                    <div className="text-center text-gray-400 py-10">
                        Chưa chọn trạm nào. Click vào marker trên bản đồ để thêm trạm.
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
