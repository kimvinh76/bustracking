import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import FormInput from '../../common/FormInput';
import Button from '../../common/Button';
import { parentsService } from '../../../services/parentsService';
import { classesService } from '../../../services/classesService';
import { routesService } from '../../../services/routesService';

const StudentForm = ({ student, mode, onSubmit, onCancel }) => {
  
  const [formData, setFormData] = useState({
    name: '', grade: '', class: '', parent_id: '', phone: '', address: '',
    morning_route_id: '', morning_pickup_stop_id: '', afternoon_route_id: '', afternoon_dropoff_stop_id: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  

  const [parents, setParents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [allRoutes, setAllRoutes] = useState([]);
  const [morningRouteStops, setMorningRouteStops] = useState([]);
  const [afternoonRouteStops, setAfternoonRouteStops] = useState([]); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [parentsData, classesData, routesData] = await Promise.all([
          parentsService.getAllParents(),
          classesService.getAllClasses(), 
          routesService.getAllRoutes()
        ]);
        setParents(parentsData || []);
        setClasses(classesData || []);
        setAllRoutes(routesData || []);
      } catch (error) {
       
        setParents([]);
        setClasses([]);
        setAllRoutes([]);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!student) return;
    
    setFormData({
      name: student.name || '', grade: student.grade || '', class: student.class_name || student.class || '',
      parent_id: student.parent_id || '', phone: student.phone || '', address: student.address || '',
      morning_route_id: student.subscriptions?.find(s => s.shift_type === 'morning')?.route_id || '',
      morning_pickup_stop_id: student.subscriptions?.find(s => s.shift_type === 'morning')?.stop_id || '',
      afternoon_route_id: student.subscriptions?.find(s => s.shift_type === 'afternoon')?.route_id || '',
      afternoon_dropoff_stop_id: student.subscriptions?.find(s => s.shift_type === 'afternoon')?.stop_id || ''
    });

 
  const loadStops = async (routeId, setStops) => {
      if (!routeId) return;
      try {
        const stops = await routesService.getRouteStops(routeId);
        setStops(stops || []);
      } catch (err) {
      
        setStops([]);
      }
    };
    
    loadStops(student.subscriptions?.find(s => s.shift_type === 'morning')?.route_id, setMorningRouteStops);
    loadStops(student.subscriptions?.find(s => s.shift_type === 'afternoon')?.route_id, setAfternoonRouteStops);
  }, [student]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Họ tên là bắt buộc';
    if (!formData.address.trim()) newErrors.address = 'Địa chỉ là bắt buộc';
    if (mode === 'add' && !formData.parent_id) newErrors.parent_id = 'Phụ huynh là bắt buộc';


    const availableGrades = [...new Set(classes.map(cls => cls.grade))];
    if (!formData.grade.trim()) {
      newErrors.grade = 'Khối là bắt buộc';
    } else if (!availableGrades.includes(formData.grade)) {
      newErrors.grade = `Khối không hợp lệ. Có: ${availableGrades.join(', ')}`;
    }


    const selectedClass = classes.find(cls => cls.class_name === formData.class);
    if (!formData.class.trim()) {
      newErrors.class = 'Lớp học là bắt buộc';
    } else if (!selectedClass) {
      newErrors.class = 'Lớp không tồn tại';
    } else if (selectedClass.grade !== formData.grade) {
      newErrors.grade = `Lớp ${formData.class} thuộc khối ${selectedClass.grade}`;
    }

    // Validate Routes & Stops
    if (formData.morning_route_id && !formData.morning_pickup_stop_id) {
      newErrors.morning_pickup_stop_id = 'Vui lòng chọn điểm đón sáng';
    }
    if (formData.afternoon_route_id && !formData.afternoon_dropoff_stop_id) {
      newErrors.afternoon_dropoff_stop_id = 'Vui lòng chọn điểm trả chiều';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Filter routes based on shift_type
  const morningRoutes = allRoutes.filter(r => r.shift_type === 'morning');
  const afternoonRoutes = allRoutes.filter(r => r.shift_type === 'afternoon');


  // Hàm trợ giúp: tải điểm dừng cho tuyến (sử dụng khi người dùng thay đổi select tuyến)
 
  const loadRouteStops = async (routeId, setStops) => {
    if (!routeId) {
      setStops([]);
      return;
    }
    try {
      const stops = await routesService.getRouteStops(routeId);
      setStops(stops || []);
    } catch (err) {
     
      setStops([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;


    if (name === 'class' && value) {
      const selectedClass = classes.find(cls => cls.class_name === value);
      if (selectedClass) {
        setFormData(prev => ({ ...prev, class: value, grade: selectedClass.grade }));
        setErrors(prev => ({ ...prev, class: '', grade: '' }));
        return;
      }
    }


    if (name === 'morning_route_id') {
      setFormData(prev => ({ ...prev, morning_route_id: value, morning_pickup_stop_id: '' }));
      loadRouteStops(value, setMorningRouteStops);
      setErrors(prev => ({ ...prev, morning_route_id: '', morning_pickup_stop_id: '' }));
      return;
    }
    
    if (name === 'afternoon_route_id') {
      setFormData(prev => ({ ...prev, afternoon_route_id: value, afternoon_dropoff_stop_id: '' }));
      loadRouteStops(value, setAfternoonRouteStops);
      setErrors(prev => ({ ...prev, afternoon_route_id: '', afternoon_dropoff_stop_id: '' }));
      return;
    }
    
  // Cập nhật giá trị trường mặc định (những input thông thường)
  // Đồng thời clear lỗi tương ứng nếu có.
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (mode === 'view') {
      onCancel();
      return;
    }

    if (validateForm()) {
      setLoading(true);
      try {
        const subscriptions = [];
        if (formData.morning_route_id && formData.morning_pickup_stop_id) {
          subscriptions.push({
            shift_type: 'morning',
            route_id: formData.morning_route_id,
            stop_id: formData.morning_pickup_stop_id
          });
        }
        if (formData.afternoon_route_id && formData.afternoon_dropoff_stop_id) {
          subscriptions.push({
            shift_type: 'afternoon',
            route_id: formData.afternoon_route_id,
            stop_id: formData.afternoon_dropoff_stop_id
          });
        }
        
        const {
          morning_route_id, morning_pickup_stop_id,
          afternoon_route_id, afternoon_dropoff_stop_id,
          ...restData
        } = formData;

        await onSubmit({ ...restData, subscriptions });
      } finally {
        setLoading(false);
      }
    }
  };

  // isReadOnly dùng để disable/readonly các input khi component được dùng chỉ để xem
  const isReadOnly = mode === 'view';

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <FormInput
          label="Họ và tên"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="Nhập họ và tên học sinh"
          required
          readOnly={isReadOnly}
        />

        <FormInput
          label="Khối"
          name="grade"
          type="select"
          value={formData.grade}
          onChange={handleChange}
          error={errors.grade}
          options={[
            { value: '', label: 'Chọn khối' },
            ...[...new Set(classes.map(cls => cls.grade))]
              .sort()
              .map(grade => ({ value: grade, label: `Khối ${grade}` }))
          ]}
          required
          readOnly={isReadOnly}
        />

        <FormInput
          label="Lớp học"
          name="class"
          type="select"
          value={formData.class}
          onChange={handleChange}
          error={errors.class}
          placeholder="Chọn lớp học"
          options={(classes || []).map(cls => ({ 
            value: cls.class_name, 
            label: `${cls.class_name} (Khối ${cls.grade})` 
          }))}
          required
          readOnly={isReadOnly}
        />

        <FormInput
          label="Phụ huynh"
          name="parent_id"
          type="select"
          value={formData.parent_id}
          onChange={handleChange}
          error={errors.parent_id}
          placeholder="Chọn phụ huynh"
          options={(parents || []).map(parent => ({
            value: parent.id,
            label: `${parent.name} - ${parent.phone || 'N/A'}`
          }))}
          required={mode === 'add'}
          readOnly={mode === 'view'}
        />

        <FormInput
          label="Số điện thoại"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          error={errors.phone}
          placeholder="Nhập số điện thoại"
          readOnly={isReadOnly}
        />

        <FormInput
          label="Tuyến đi (Sáng)"
          name="morning_route_id"
          type="select"
          value={formData.morning_route_id}
          onChange={handleChange}
          error={errors.morning_route_id}
          options={[{ value: '', label: 'Không đi / Chọn tuyến đi' }, ...(morningRoutes || []).map(r => ({ value: r.id, label: r.route_name || r.name || `Tuyến ${r.id}` }))]}
          readOnly={isReadOnly}
        />

        <FormInput
          label="Điểm đón (Sáng)"
          name="morning_pickup_stop_id"
          type="select"
          value={formData.morning_pickup_stop_id}
          onChange={handleChange}
          error={errors.morning_pickup_stop_id}
          options={[
            { value: '', label: 'Chọn điểm đón' }, 
            ...(morningRouteStops || [])
              .filter(s => s.stop_order !== 0 && s.stop_order !== 99)
              .map(s => ({ 
                value: s.stop_id, 
                label: `${s.name} - ${s.address}` 
              }))
          ]}
          readOnly={isReadOnly}
          disabled={!formData.morning_route_id}
        />

        <FormInput
          label="Tuyến về (Chiều)"
          name="afternoon_route_id"
          type="select"
          value={formData.afternoon_route_id}
          onChange={handleChange}
          error={errors.afternoon_route_id}
          options={[{ value: '', label: 'Không đi / Chọn tuyến về' }, ...(afternoonRoutes || []).map(r => ({ value: r.id, label: r.route_name || r.name || `Tuyến ${r.id}` }))]}
          readOnly={isReadOnly}
        />

        <FormInput
          label="Điểm trả (Chiều)" 
          name="afternoon_dropoff_stop_id"
          type="select"
          value={formData.afternoon_dropoff_stop_id}
          onChange={handleChange}
          error={errors.afternoon_dropoff_stop_id}
          options={[
            { value: '', label: 'Chọn điểm trả' },
            ...(afternoonRouteStops || [])
              .filter(s => s.stop_order !== 0 && s.stop_order !== 99)
              .map(s => ({ 
                value: s.stop_id, 
                label: `${s.name} - ${s.address}` 
              }))
          ]}
          readOnly={isReadOnly}
          disabled={!formData.afternoon_route_id}
        />
      </div>

      <FormInput
        label="Địa chỉ"
        name="address"
        type="textarea"
        value={formData.address}
        onChange={handleChange}
        error={errors.address}
        placeholder="Nhập địa chỉ đầy đủ"
        required
        readOnly={isReadOnly}
        rows={3}
      />

      <div className="flex gap-3 justify-end pt-6 mt-6 border-t border-slate-200">
        <Button variant="secondary" onClick={onCancel}>
          {isReadOnly ? 'Đóng' : 'Hủy'}
        </Button>
        {!isReadOnly && (
          <Button type="submit" loading={loading}>
            {mode === 'add' ? 'Thêm mới' : 'Cập nhật'}
          </Button>
        )}
      </div>
    </form>
  );
};


export default StudentForm;