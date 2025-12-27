// ===================================
// SERVICE: STUDENT
// ===================================
// Logic nghiệp vụ phức tạp, validation, kết hợp nhiều model
// ===================================

import StudentModel from '../models/Student.js';
import ClassModel from '../models/Class.js';

class StudentService {
  /**
   * Lấy tất cả học sinh
   */
  static async getAllStudents() {
    return await StudentModel.findAll();
  }

  /**
   * Lấy học sinh theo ID
   */
  static async getStudentById(id) {
    if (!id || isNaN(id)) {
      throw new Error('ID không hợp lệ');
    }

    const student = await StudentModel.findById(id);
    
    if (!student) {
      throw new Error('Không tìm thấy học sinh');
    }

    return student;
  }

  /**
   * Lấy học sinh theo lớp
   */
  static async getStudentsByClass(className) {
    if (!className) {
      throw new Error('Tên lớp là bắt buộc');
    }

    return await StudentModel.findByClass(className);
  }

  /**
   * Lấy học sinh theo tuyến đường
   */
  static async getStudentsByRoute(routeId, timeOfDay = 'morning') {
    if (!routeId || isNaN(routeId)) {
      throw new Error('ID tuyến đường không hợp lệ');
    }

    if (!['morning', 'afternoon'].includes(timeOfDay)) {
      throw new Error('timeOfDay phải là "morning" hoặc "afternoon"');
    }

    return await StudentModel.findByRoute(routeId, timeOfDay);
  }

  /**
   * Tìm kiếm học sinh theo tên
   */
  static async searchStudents(searchTerm) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new Error('Từ khóa tìm kiếm phải có ít nhất 2 ký tự');
    }

    return await StudentModel.searchByName(searchTerm.trim());
  }

  /**
   * Tạo học sinh mới
   */
  static async createStudent(studentData) {
    // Validation cơ bản
    const { name, class: class_name } = studentData;

    if (!name || !class_name) {
      throw new Error('Tên và lớp học là bắt buộc');
    }

    // Kiểm tra lớp học có tồn tại
    const classInfo = await ClassModel.findByName(class_name);
    
    if (!classInfo) {
      throw new Error(`Không tìm thấy lớp học "${class_name}"`);
    }

    // Tự động điền class_id và grade từ thông tin lớp
    studentData.class_id = classInfo.id;
    studentData.grade = classInfo.grade;

    // Format dữ liệu
    studentData.name = name.trim();
    studentData.class = class_name.trim();

    // Tạo học sinh
    return await StudentModel.create(studentData);
  }

  /**
   * Cập nhật học sinh
   */
  static async updateStudent(id, studentData) {
    // Validation
    if (!id || isNaN(id)) {
      throw new Error('ID không hợp lệ');
    }

    const { name, class: class_name } = studentData;

    if (!name || !class_name) {
      throw new Error('Tên và lớp học là bắt buộc');
    }

    // Kiểm tra học sinh có tồn tại
    const exists = await StudentModel.exists(id);
    if (!exists) {
      throw new Error('Không tìm thấy học sinh để cập nhật');
    }

    // Kiểm tra lớp học
    const classInfo = await ClassModel.findByName(class_name);
    
    if (!classInfo) {
      throw new Error(`Không tìm thấy lớp học "${class_name}"`);
    }

    // Tự động điền class_id và grade
    studentData.class_id = classInfo.id;
    studentData.grade = classInfo.grade;

    // Format dữ liệu
    studentData.name = name.trim();
    studentData.class = class_name.trim();

    return await StudentModel.update(id, studentData);
  }

  /**
   * Xóa học sinh
   */
  static async deleteStudent(id) {
    if (!id || isNaN(id)) {
      throw new Error('ID không hợp lệ');
    }

    const exists = await StudentModel.exists(id);
    if (!exists) {
      throw new Error('Không tìm thấy học sinh để xóa');
    }

    // Soft delete (chỉ thay đổi status)
    const deleted = await StudentModel.delete(id);
    
    if (!deleted) {
      throw new Error('Xóa học sinh thất bại');
    }

    return true;
  }

  /**
   * Gán học sinh vào tuyến đường
   */
  static async assignStudentToRoute(studentId, routeData) {
    const { routeId, timeOfDay, stopId } = routeData;

    if (!routeId || !timeOfDay || !stopId) {
      throw new Error('Thiếu thông tin tuyến đường, thời gian hoặc trạm');
    }

    // Lấy thông tin học sinh hiện tại
    const student = await this.getStudentById(studentId);

    // Cập nhật tuyến đường
    const updateData = { ...student };

    if (timeOfDay === 'morning') {
      updateData.morning_route_id = routeId;
      updateData.morning_pickup_stop_id = stopId;
    } else if (timeOfDay === 'afternoon') {
      updateData.afternoon_route_id = routeId;
      updateData.afternoon_dropoff_stop_id = stopId;
    } else {
      throw new Error('timeOfDay phải là "morning" hoặc "afternoon"');
    }

    return await StudentModel.update(studentId, updateData);
  }
}

export default StudentService;
