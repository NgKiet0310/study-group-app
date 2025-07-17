export default function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    req.user = req.session.user; 
    return next();
  }

  if (req.originalUrl.startsWith('/api')) {
    return res.status(401).json({ error: 'Unauthorized. Vui lòng đăng nhập.' });
  }

  return res.redirect('/auth/login?error=Bạn cần đăng nhập');
}
