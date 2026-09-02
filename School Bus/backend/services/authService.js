// services/authService.js
// Business logic layer cho Authentication

import UserModel from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

function httpError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

class AuthService {
  /**
   * Đăng nhập
   */
  static async login(credentials) {
    console.log(' SERVICE: Xử lý đăng nhập');
    console.log(' SERVICE: Credentials:', { identifier: credentials.identifier });
    
    // 1. Validation
    const { identifier, password } = credentials;
    
    if (!identifier || !password) {
      console.log(' SERVICE: Thiếu thông tin đăng nhập');
      throw httpError('Thiếu thông tin: email/username và password', 400);
    }

    // 2. Tìm user theo email hoặc username
    const user = await UserModel.findByEmailOrUsername(identifier);
    if (!user) {
      console.log(' SERVICE: Không tìm thấy người dùng');
      throw httpError('Email/Username hoặc mật khẩu không đúng', 401);
    }

    // 3. Verify password bằng bcrypt
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      console.log(' SERVICE: Mật khẩu không đúng');
      throw httpError('Email/Username hoặc mật khẩu không đúng', 401);
    }

    console.log(' SERVICE: Mật khẩu đúng');

    // 4. Tạo JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'YOUR_SECRET_KEY',
      { expiresIn: '12h' }
    );

    // 5. Trả về user info (không có password)
    const { password: _, ...userWithoutPassword } = user;

    console.log(' SERVICE: Đăng nhập thành công');
    
    return {
      token,
      user: userWithoutPassword
    };
  }

  /**
   * Đăng ký (Register)
   */
  static async register(userData) {
    console.log(' SERVICE: Xử lý đăng ký');
    
    // 1. Validation
    const { username, email, password, role = 'parent' } = userData;
    
    if (!username || !email || !password) {
      throw new Error('Thiếu thông tin bắt buộc: username, email, password');
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Email không hợp lệ');
    }

    // 3. Validate password length
    if (password.length < 6) {
      throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
    }

    // 4. Kiểm tra trùng email
    const emailExists = await UserModel.emailExists(email);
    if (emailExists) {
      throw new Error('Email đã được sử dụng');
    }

    // 5. Kiểm tra trùng username
    const usernameExists = await UserModel.usernameExists(username);
    if (usernameExists) {
      throw new Error('Username đã được sử dụng');
    }

    // 6. Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // 7. Tạo user mới
    const newUser = await UserModel.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role
    });

    console.log(' SERVICE: Đăng ký thành công, user_id:', newUser.id);

    // 8. Tạo JWT token cho user mới
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      process.env.JWT_SECRET || 'YOUR_SECRET_KEY',
      { expiresIn: '12h' }
    );

    const { password: _, ...userWithoutPassword } = newUser;

    return {
      token,
      user: userWithoutPassword
    };
  }

  /**
   * Verify token
   */
  static async verifyToken(token) {
    console.log(' SERVICE: Verify token');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'YOUR_SECRET_KEY');
    
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      throw new Error('Token không hợp lệ (User không tồn tại)');
    }
    
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Đổi mật khẩu
   */
  static async changePassword(userId, oldPassword, newPassword) {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error('Không tìm thấy người dùng');

    const isMatch = bcrypt.compareSync(oldPassword, user.password);
    if (!isMatch) throw new Error('Mật khẩu cũ không đúng');

    if (newPassword.length < 6) throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự');

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await UserModel.updatePassword(userId, hashedPassword);

    return { message: 'Đổi mật khẩu thành công' };
  }

  /**
   * Reset mật khẩu
   */
  static async resetPassword(email) {
    const user = await UserModel.findByEmail(email);
    if (!user) return { message: 'Nếu email tồn tại, chúng tôi đã gửi link reset mật khẩu' };

    console.log(' SERVICE: Đã gửi link reset password (mock)');
    return { message: 'Nếu email tồn tại, chúng tôi đã gửi link reset mật khẩu' };
  }
}

export default AuthService;

