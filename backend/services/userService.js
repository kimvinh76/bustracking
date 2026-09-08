// services/userService.js
// Business logic layer cho User

import UserModel from '../models/User.js';

class UserService {
  /**
   * Lấy tất cả người dùng
   */
  static async getAllUsers() {
    console.log(' SERVICE: Lấy tất cả người dùng');
    const users = await UserModel.findAll();
    return users;
  }

  /**
   * Lấy người dùng theo ID
   */
  static async getUserById(id) {
    console.log(' SERVICE: Lấy người dùng theo ID:', id);
    
    const user = await UserModel.findById(id);
    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }
    
    return user;
  }

  /**
   * Lấy người dùng theo email
   */
  static async getUserByEmail(email) {
    console.log(' SERVICE: Lấy người dùng theo email:', email);
    
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new Error('Không tìm thấy người dùng với email này');
    }
    
    // Không trả về password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Lấy người dùng theo role
   */
  static async getUsersByRole(role) {
    console.log(' SERVICE: Lấy người dùng theo role:', role);
    
    // Validate role
    const validRoles = ['admin', 'driver', 'parent'];
    if (!validRoles.includes(role)) {
      throw new Error('Role không hợp lệ (admin/driver/parent)');
    }
    
    const users = await UserModel.findByRole(role);
    return users;
  }

  /**
   * Tạo người dùng mới
   */
  static async createUser(userData) {
    console.log(' SERVICE: Bắt đầu tạo người dùng mới');
    console.log(' SERVICE: Dữ liệu nhận được:', userData);
    
    // 1. Validation
    const { username, email, password, role = 'parent' } = userData;
    
    if (!username || !email || !password) {
      console.log(' SERVICE: Thiếu thông tin bắt buộc');
      throw new Error('Thiếu thông tin bắt buộc: username, email, password');
    }

    console.log(' SERVICE: Validation passed');

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log(' SERVICE: Email không hợp lệ');
      throw new Error('Email không hợp lệ');
    }

    // 3. Validate password length
    if (password.length < 6) {
      console.log(' SERVICE: Mật khẩu quá ngắn');
      throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
    }

    // 4. Validate role
    const validRoles = ['admin', 'driver', 'parent'];
    if (!validRoles.includes(role)) {
      throw new Error('Role không hợp lệ (admin/driver/parent)');
    }

    // 5. Kiểm tra trùng email
    const emailExists = await UserModel.emailExists(email);
    if (emailExists) {
      console.log(' SERVICE: Email đã tồn tại');
      throw new Error('Email đã được sử dụng');
    }
    
    console.log(' SERVICE: Email hợp lệ');

    // 6. Kiểm tra trùng username
    const usernameExists = await UserModel.usernameExists(username);
    if (usernameExists) {
      console.log(' SERVICE: Username đã tồn tại');
      throw new Error('Username đã được sử dụng');
    }
    
    console.log(' SERVICE: Username hợp lệ');

    // 7. TODO: Hash password
    // const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPassword = password; // Tạm thời chưa hash

    // 8. Format dữ liệu
    const formattedData = {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role
    };
    
    console.log(' SERVICE: Dữ liệu sau khi format:', { ...formattedData, password: '***' });

    // 9. Tạo user
    const newUser = await UserModel.create(formattedData);
    
    console.log(' SERVICE: Tạo người dùng thành công');
    return newUser;
  }

  /**
   * Cập nhật người dùng
   */
  static async updateUser(id, userData) {
    console.log(' SERVICE: Cập nhật người dùng ID:', id);
    
    // 1. Kiểm tra tồn tại
    await this.getUserById(id);

    // 2. Validation
    const { username, email, role } = userData;
    
    if (!username || !email || !role) {
      throw new Error('Thiếu thông tin bắt buộc');
    }

    // 3. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Email không hợp lệ');
    }

    // 4. Validate role
    const validRoles = ['admin', 'driver', 'parent'];
    if (!validRoles.includes(role)) {
      throw new Error('Role không hợp lệ');
    }

    // 5. Kiểm tra trùng email (loại trừ chính nó)
    const emailExists = await UserModel.emailExists(email, id);
    if (emailExists) {
      throw new Error('Email đã được sử dụng');
    }

    // 6. Kiểm tra trùng username (loại trừ chính nó)
    const usernameExists = await UserModel.usernameExists(username, id);
    if (usernameExists) {
      throw new Error('Username đã được sử dụng');
    }

    // 7. Format dữ liệu
    const formattedData = {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      role
    };

    // 8. Cập nhật
    const updatedUser = await UserModel.update(id, formattedData);
    
    console.log(' SERVICE: Cập nhật người dùng thành công');
    return updatedUser;
  }

  /**
   * Cập nhật mật khẩu
   */
  static async updatePassword(id, oldPassword, newPassword) {
    console.log(' SERVICE: Cập nhật mật khẩu user ID:', id);
    
    // 1. Kiểm tra user tồn tại
    const user = await UserModel.findById(id);
    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }

    // 2. TODO: Verify old password
    // const isMatch = await bcrypt.compare(oldPassword, user.password);
    // if (!isMatch) {
    //   throw new Error('Mật khẩu cũ không đúng');
    // }

    // 3. Validate new password length
    if (newPassword.length < 6) {
      throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    // 4. TODO: Hash new password
    // const hashedPassword = await bcrypt.hash(newPassword, 10);
    const hashedPassword = newPassword; // Tạm thời chưa hash

    // 5. Cập nhật password
    const updated = await UserModel.updatePassword(id, hashedPassword);
    if (!updated) {
      throw new Error('Không thể cập nhật mật khẩu');
    }

    console.log(' SERVICE: Cập nhật mật khẩu thành công');
    return { message: 'Cập nhật mật khẩu thành công' };
  }

  /**
   * Xóa người dùng
   */
  static async deleteUser(id) {
    console.log(' SERVICE: Xóa người dùng ID:', id);
    
    // 1. Kiểm tra tồn tại
    await this.getUserById(id);

    // 2. TODO: Kiểm tra xem user có đang liên kết với driver/parent không
    // Không nên xóa user nếu còn dữ liệu liên quan

    // 3. Xóa user
    const deleted = await UserModel.delete(id);
    if (!deleted) {
      throw new Error('Không thể xóa người dùng');
    }

    console.log(' SERVICE: Xóa người dùng thành công');
    return { message: 'Xóa người dùng thành công' };
  }
}

export default UserService;
