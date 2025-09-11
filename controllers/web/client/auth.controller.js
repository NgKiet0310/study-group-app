import User from "../../../models/User.js";
import bcrypt from 'bcrypt';

export const LoginForm = (req,res) => {
  const {success, error} = req.query;
    res.render("client/pages/login", {
    title: "Login",
    view: "/home",
    success: success || null,
    error: error || null
  });
}

export const RegisterForm = (req,res)=> {
    res.render("client/pages/register", {
    view: "/home",
    title: "Register"
    });
}

export const register = async (req, res, next) => {
  try {
    const { username, password, confirmPassword } = req.body;

    // Kiểm tra thông tin bắt buộc
    if (!username || !password || !confirmPassword) {
      return res.render("client/pages/register", {
        title: "Đăng kí tài khoản",
        error: "Vui lòng nhập đầy đủ thông tin",
        username,
      });
    }

    const phoneRegex = /^[0-9]{9,11}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!phoneRegex.test(username) && !emailRegex.test(username)) {
      return res.render("client/pages/register", {
        title: "Đăng kí tài khoản",
        error: "Username phải là số điện thoại hoặc email hợp lệ",
        username,
      });
    }

    if (password.length < 6) {
      return res.render("client/pages/register", {
        title: "Đăng kí tài khoản",
        error: "Mật khẩu phải có ít nhất 6 ký tự",
        username,
      });
    }


    if (password !== confirmPassword) {
      return res.render("client/pages/register", {
        title: "Đăng kí tài khoản",
        error: "Mật khẩu nhập lại không khớp",
        username,
      });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.render("client/pages/register", {
        title: "Đăng kí tài khoản",
        error: "Tên đăng nhập đã tồn tại",
        username,
      });
    }

    const user = new User({ username, password });
    await user.save();

    res.redirect("/auth/login?success=Đăng ký thành công");
  } catch (error) {
    next(error);
  }
};

export const Login = async (req, res, next) => {
  try {
     const { username, password } = req.body;
    if (!username || !password) {
      return res.render("client/pages/login", {
        title: "Login",
        error: "Vui lòng nhập đầy đủ thông tin",
        success: null
      });
    }


    const user = await User.findOne({ username });
    console.log('User found:', user); 
    if (!user) {
      return res.render("client/pages/login", {
        title: "Login",
        error: "Tài khoản không tồn tại",
        success: null
      });
    }


    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("client/pages/login", {
        title: "Login",
        error: "Mật khẩu không chính xác",
        success: null
      });
    }


   req.session.user = {
   _id: user._id,
   role: user.role,
   username: user.username,
   };


    req.session.success = "Đăng nhập thành công!";
    res.redirect("/home?success=Đăng nhập thành công");
  } catch (error) {
    next(error);
  }
};

export const Logout = (req, res) => {
  req.session.destroy((err) =>{
    if(err){
      console.error("Error Destroying Session:", err);
      return res.redirect("client/pages/home?error=Đăng xuất thất bại");
    }
    res.redirect("login?success=Đăng xuất thành công");
  });
};