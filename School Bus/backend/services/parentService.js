// services/parentService.js
// Business logic layer cho Parent

import ParentModel from '../models/Parent.js';
import UserModel from '../models/User.js';

class ParentService {
  /**
   * Lấy tất cả phụ huynh
   */
  static async getAllParents() {
    console.log('🔸 SERVICE: Lấy tất cả phụ huynh');
    const parents = await ParentModel.findAll();
    return parents;
  }

  /**
   * Lấy phụ huynh theo ID
   */
  static async getParentById(id) {
    console.log('🔸 SERVICE: Lấy phụ huynh theo ID:', id);
    
    const parent = await ParentModel.findById(id);
    if (!parent) {
      throw new Error('Không tìm thấy phụ huynh');
    }
    
    return parent;
  }

  /**
   * Lấy phụ huynh theo user_id
   */
  static async getParentByUserId(userId) {
    console.log('🔸 SERVICE: Lấy phụ huynh theo user_id:', userId);
    
    const parent = await ParentModel.findByUserId(userId);
    if (!parent) {
      throw new Error('Không tìm thấy phụ huynh với user_id này');
    }
    
    return parent;
  }

  /**
   * Lấy phụ huynh kèm danh sách con
   */
  static async getParentWithChildren(id) {
    console.log('🔸 SERVICE: Lấy phụ huynh kèm danh sách con');
    
    const parent = await ParentModel.findWithChildren(id);
    if (!parent) {
      throw new Error('Không tìm thấy phụ huynh');
    }
    
    return parent;
  }

  /**
   * Lấy thông báo của phụ huynh
   */
  static async getParentNotifications(id) {
    console.log('🔸 SERVICE: Lấy thông báo của phụ huynh');
    
    // Kiểm tra phụ huynh tồn tại
    await this.getParentById(id);
    
    const notifications = await ParentModel.getNotifications(id);
    return notifications;
  }

  /**
   * Tạo phụ huynh mới
   */
  static async createParent(parentData) {
    console.log('🔸 SERVICE: Bắt đầu tạo phụ huynh mới');
    console.log('📦 SERVICE: Dữ liệu nhận được:', parentData);
    
    // 1. Validation
    const { name, phone, address, relationship = 'Cha/Mẹ' } = parentData;
    
    if (!name || !phone) {
      console.log('❌ SERVICE: Thiếu thông tin bắt buộc');
      throw new Error('Thiếu thông tin bắt buộc: tên, số điện thoại');
    }

    // 2. Validate phone format (10 số)
    if (!/^[0-9]{10}$/.test(phone)) {
      console.log('❌ SERVICE: Số điện thoại không hợp lệ');
      throw new Error('Số điện thoại không hợp lệ (phải 10 số)');
    }

    console.log('✅ SERVICE: Validation passed');

    // 3. Kiểm tra trùng số điện thoại
    const existingParent = await ParentModel.findByPhone(phone);
    if (existingParent) {
      console.log('❌ SERVICE: Số điện thoại đã tồn tại');
      throw new Error('Số điện thoại đã được sử dụng');
    }
    
    console.log('✅ SERVICE: Không trùng số điện thoại');

    // 4. Tạo user account (nếu cần)
    let user_id = null;
    if (parentData.create_account) {
      console.log('🔸 SERVICE: Tạo user account cho phụ huynh');
      const username = `parent_${phone}`;
      const email = parentData.email || `${username}@schoolbus.com`;
      const defaultPassword = "parent123"; // TODO: Hash password
      
      try {
        const existingUser = await UserModel.findByEmail(email);
        if (existingUser) {
          throw new Error('Email đã được sử dụng');
        }
        
        const newUser = await UserModel.create({
          username,
          email,
          password: defaultPassword,
          role: 'parent'
        });
        user_id = newUser.id;
        console.log('✅ SERVICE: Tạo user account thành công, user_id:', user_id);
      } catch (err) {
        console.log('❌ SERVICE: Lỗi tạo user account:', err.message);
        throw new Error(`Lỗi tạo tài khoản: ${err.message}`);
      }
    }

    // 5. Format dữ liệu
    const formattedData = {
      name: name.trim(),
      phone,
      address: address ? address.trim() : null,
      relationship,
      user_id
    };
    
    console.log('🔸 SERVICE: Dữ liệu sau khi format:', formattedData);

    // 6. Tạo parent
    const newParent = await ParentModel.create(formattedData);
    
    console.log('✅ SERVICE: Tạo phụ huynh thành công');
    return newParent;
  }

  /**
   * Cập nhật phụ huynh
   */
  static async updateParent(id, parentData) {
    console.log('🔸 SERVICE: Cập nhật phụ huynh ID:', id);
    
    // 1. Kiểm tra tồn tại
    await this.getParentById(id);

    // 2. Validation
    const { name, phone, address, relationship } = parentData;
    
    if (!name || !phone) {
      throw new Error('Thiếu thông tin bắt buộc');
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      throw new Error('Số điện thoại không hợp lệ (phải 10 số)');
    }

    // 3. Kiểm tra trùng số điện thoại (loại trừ chính nó)
    const existingParent = await ParentModel.findByPhone(phone);
    if (existingParent && existingParent.id !== parseInt(id)) {
      throw new Error('Số điện thoại đã được sử dụng');
    }

    // 4. Format dữ liệu
    const formattedData = {
      name: name.trim(),
      phone,
      address: address ? address.trim() : null,
      relationship,
      user_id: parentData.user_id || null
    };

    // 5. Cập nhật
    const updatedParent = await ParentModel.update(id, formattedData);
    
    console.log('✅ SERVICE: Cập nhật phụ huynh thành công');
    return updatedParent;
  }

  /**
   * Xóa phụ huynh
   */
  static async deleteParent(id) {
    console.log('🔸 SERVICE: Xóa phụ huynh ID:', id);
    
    // 1. Kiểm tra tồn tại
    const parent = await this.getParentById(id);

    // 2. TODO: Kiểm tra xem phụ huynh có con không
    // const children = await ParentModel.findWithChildren(id);
    // if (children.children && children.children.length > 0) {
    //   throw new Error('Không thể xóa phụ huynh đang có con');
    // }

    // 3. Xóa parent
    const deleted = await ParentModel.delete(id);
    if (!deleted) {
      throw new Error('Không thể xóa phụ huynh');
    }

    // 4. Xóa user account (nếu có)
    if (parent.user_id) {
      console.log('🔸 SERVICE: Xóa user account, user_id:', parent.user_id);
      await UserModel.delete(parent.user_id);
    }

    console.log('✅ SERVICE: Xóa phụ huynh thành công');
    return { message: 'Xóa phụ huynh thành công' };
  }
}

export default ParentService;
