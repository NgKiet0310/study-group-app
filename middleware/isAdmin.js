export default function isAdmin(req, res, next) {
  if (req.session && req.session.admin && req.session.admin.role === 'admin') {
    return next();
  }

  if (req.originalUrl.startsWith('/api')) {
    return res.status(403).json({ error: 'Forbidden. Admin only.' });
  }

  return res.redirect('/admin/auth/login?error=Bạn cần đăng nhập quyền admin');
}
