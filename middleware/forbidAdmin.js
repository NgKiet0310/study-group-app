export const forbidAdmin = (req, res, next) => {
  if (req.originalUrl.startsWith('/auth/login') || req.originalUrl.startsWith('/auth/register')) {
    return next();
  }

  if ((req.session.user && req.session.user.role === 'admin') || req.session.admin) {
    return res.redirect('/auth/login?error=Admin không thể truy cập');
  }

  next();
};
