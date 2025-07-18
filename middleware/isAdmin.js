export default function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }

  // Nếu API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(403).json({ error: 'Forbidden. Admin only.' });
  }

  // Nếu giao diện web
  return res.redirect('/auth/login?error=Bạn không có quyền truy cập admin');
}
