// services/authService.js
// Business logic layer cho Authentication

import UserModel from '../models/User.js';

class AuthService {
  /**
   * Đăng nhập
   */
  static async login(credentials) {
    console.log('🔸 SERVICE: Xử lý đăng nhập');
    console.log('📦 SERVICE: Credentials:', { identifier: credentials.identifier });
    
    // 1. Validation
    const { identifier, password } = credentials; // identifier có thể là email hoặc username
    
    if (!identifier || !password) {
      console.log('❌ SERVICE: Thiếu thông tin đăng nhập');
      throw new Error('Thiếu thông tin: email/username và password');
    }

    console.log('✅ SERVICE: Validation passed');

    // 2. Tìm user theo email hoặc username
    const user = await UserModel.findByEmailOrUsername(identifier);
    if (!user) {
      console.log('❌ SERVICE: Không tìm thấy người dùng');
      throw new Error('Email/Username hoặc mật khẩu không đúng');
    }

    console.log('✅ SERVICE: Tìm thấy user, id:', user.id);

    // 3. TODO: Verify password
    // const isMatch = await bcrypt.compare(password, user.password);
    // if (!isMatch) {
    //   console.log('❌ SERVICE: Mật khẩu không đúng');
    //   throw new Error('Email/Username hoặc mật khẩu không đúng');
    // }

    // Tạm thời so sánh trực tiếp (KHÔNG AN TOÀN - chỉ dùng để test)
    if (password !== user.password) {
      console.log('❌ SERVICE: Mật khẩu không đúng');
      throw new Error('Email/Username hoặc mật khẩu không đúng');
    }

    console.log('✅ SERVICE: Mật khẩu đúng');

    // 4. TODO: Tạo JWT token
    // const token = jwt.sign(
    //   { id: user.id, email: user.email, role: user.role },
    //   process.env.JWT_SECRET,
    //   { expiresIn: '24h' }
    // );

    // Tạm thời trả về user info (KHÔNG AN TOÀN - chỉ dùng để test)
    const token = `mock_token_${user.id}`;

    // 5. Trả về user info (không có password)
    const { password: _, ...userWithoutPassword } = user;

    console.log('✅ SERVICE: Đăng nhập thành công');
    
    return {
      token,
      user: userWithoutPassword
    };
  }

  /**
   * Đăng ký (Register)
   */
  static async register(userData) {
    console.log('🔸 SERVICE: Xử lý đăng ký');
    console.log('📦 SERVICE: Dữ liệu đăng ký:', { username: userData.username, email: userData.email });
    
    // 1. Validation
    const { username, email, password, role = 'parent' } = userData;
    
    if (!username || !email || !password) {
      console.log('❌ SERVICE: Thiếu thông tin bắt buộc');
      throw new Error('Thiếu thông tin bắt buộc: username, email, password');
    }

    console.log('✅ SERVICE: Validation passed');

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ SERVICE: Email không hợp lệ');
      throw new Error('Email không hợp lệ');
    }

    // 3. Validate password length
    if (password.length < 6) {
      console.log('❌ SERVICE: Mật khẩu quá ngắn');
      throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
    }

    // 4. Kiểm tra trùng email
    const emailExists = await UserModel.emailExists(email);
    if (emailExists) {
      console.log('❌ SERVICE: Email đã tồn tại');
      throw new Error('Email đã được sử dụng');
    }
    
    console.log('✅ SERVICE: Email hợp lệ');

    // 5. Kiểm tra trùng username
    const usernameExists = await UserModel.usernameExists(username);
    if (usernameExists) {
      console.log('❌ SERVICE: Username đã tồn tại');
      throw new Error('Username đã được sử dụng');
    }
    
    console.log('✅ SERVICE: Username hợp lệ');

    // 6. TODO: Hash password
    // const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPassword = password; // Tạm thời chưa hash

    // 7. Tạo user mới
    const newUser = await UserModel.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role
    });

    console.log('✅ SERVICE: Đăng ký thành công, user_id:', newUser.id);

    // 8. TODO: Tạo JWT token
    const token = `mock_token_${newUser.id}`;

    return {
      token,
      user: newUser
    };
  }

  /**
   * Verify token (TODO: Implement JWT verification)
   */
  static async verifyToken(token) {
    console.log('🔸 SERVICE: Verify token');
    
    // TODO: Implement JWT verification
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // return decoded;

    // Tạm thời mock
    if (!token || !token.startsWith('mock_token_')) {
      throw new Error('Token không hợp lệ');
    }

    const userId = token.replace('mock_token_', '');
    const user = await UserModel.findById(parseInt(userId));
    
    if (!user) {
      throw new Error('Token không hợp lệ');
    }

    return user;
  }

  /**
   * Đổi mật khẩu
   */
  static async changePassword(userId, oldPassword, newPassword) {
    console.log('🔸 SERVICE: Đổi mật khẩu user ID:', userId);
    
    // 1. Tìm user
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }

    // 2. TODO: Verify old password
    // const isMatch = await bcrypt.compare(oldPassword, user.password);
    // if (!isMatch) {
    //   throw new Error('Mật khẩu cũ không đúng');
    // }

    // Tạm thời so sánh trực tiếp
    if (oldPassword !== user.password) {
      console.log('❌ SERVICE: Mật khẩu cũ không đúng');
      throw new Error('Mật khẩu cũ không đúng');
    }

    // 3. Validate new password
    if (newPassword.length < 6) {
      throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    // 4. TODO: Hash new password
    // const hashedPassword = await bcrypt.hash(newPassword, 10);
    const hashedPassword = newPassword;

    // 5. Cập nhật password
    await UserModel.updatePassword(userId, hashedPassword);

    console.log('✅ SERVICE: Đổi mật khẩu thành công');
    return { message: 'Đổi mật khẩu thành công' };
  }

  /**
   * Reset mật khẩu (TODO: Implement email verification)
   */
  static async resetPassword(email) {
    console.log('🔸 SERVICE: Reset mật khẩu cho email:', email);
    
    // 1. Tìm user
    const user = await UserModel.findByEmail(email);
    if (!user) {
      // Không nên báo email không tồn tại (security)
      console.log('⚠️ SERVICE: Email không tồn tại, nhưng không báo lỗi');
      return { message: 'Nếu email tồn tại, chúng tôi đã gửi link reset mật khẩu' };
    }

    // 2. TODO: Tạo reset token và gửi email
    // const resetToken = crypto.randomBytes(32).toString('hex');
    // await sendResetPasswordEmail(email, resetToken);

    console.log('✅ SERVICE: Đã gửi link reset password (mock)');
    return { message: 'Nếu email tồn tại, chúng tôi đã gửi link reset mật khẩu' };
  }
}

export default AuthService;
