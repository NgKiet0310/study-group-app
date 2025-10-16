import bcrypt from 'bcryptjs';
import User from '../../../models/User.js';

export const showLoginForm = (req, res) => {
  res.render('admin/pages/login', {
    error: req.query.error || null
  });
};

export const handleLogin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    console.log('User found:', user); 

    if (!user) {
      return res.redirect('/admin/auth/login?error=Tài khoản không tồn tại.');
    }


    if (user.role !== 'admin') {
      return res.redirect('/admin/auth/login?error=Bạn không có quyền truy cập trang quản trị.');
    }


    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.redirect('/admin/auth/login?error=Mật khẩu không đúng.');
    }


   req.session.admin = {
   _id: user._id,
   role: user.role,
   username: user.username, 
   };

   
    return res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Lỗi đăng nhập:', err);
    return res.redirect('/admin/auth/login?error=Đã xảy ra lỗi, vui lòng thử lại.');
  }
};

// Xử lý logout
export const handleLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Lỗi khi đăng xuất');
    }
    res.clearCookie('admin.sid');
    res.set('Cache-Control', 'no-store'); 
    res.redirect('/admin/auth/login');
  });
};
  