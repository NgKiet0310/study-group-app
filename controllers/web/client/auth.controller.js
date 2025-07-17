import User from "../../../models/User.js";

export const LoginForm = (req,res) => {
  const {success, error} = req.query;
    res.render("client/login", {
    title: "Login",
    success: success || null,
    error: error || null
  });
}

export const RegisterForm = (req,res)=> {
    res.render("client/register", {
    title: "Register"
    });
}

export const register = async (req, res, next) => {
  try {
    const { username, password, confirmPassword } = req.body;

    // Kiểm tra thông tin bắt buộc
    if (!username || !password || !confirmPassword) {
      return res.render("client/register", {
        title: "Đăng kí tài khoản",
        error: "Vui lòng nhập đầy đủ thông tin",
        username,
      });
    }

    // Kiểm tra username phải là sđt hoặc email
    const phoneRegex = /^[0-9]{9,11}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!phoneRegex.test(username) && !emailRegex.test(username)) {
      return res.render("client/register", {
        title: "Đăng kí tài khoản",
        error: "Username phải là số điện thoại hoặc email hợp lệ",
        username,
      });
    }

    // Kiểm tra mật khẩu tối thiểu
    if (password.length < 6) {
      return res.render("client/register", {
        title: "Đăng kí tài khoản",
        error: "Mật khẩu phải có ít nhất 6 ký tự",
        username,
      });
    }

    // Kiểm tra xác nhận mật khẩu
    if (password !== confirmPassword) {
      return res.render("client/register", {
        title: "Đăng kí tài khoản",
        error: "Mật khẩu nhập lại không khớp",
        username,
      });
    }

    // Kiểm tra username có tồn tại chưa
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.render("client/register", {
        title: "Đăng kí tài khoản",
        error: "Tên đăng nhập đã tồn tại",
        username,
      });
    }

    // Tạo user mới
    const user = new User({ username, password });
    await user.save();

    res.redirect("/auth/login?success=Đăng ký thành công");
  } catch (error) {
    next(error);
  }
};
