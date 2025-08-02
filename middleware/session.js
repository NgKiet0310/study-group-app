// middleware/session.js
import session from 'express-session';
import { sessionOptions } from '../config/session.js';


export const sessionUser = session({
  ...sessionOptions,
  name: 'user.sid',
});

export const attachUserToLocals = (req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
};


export const sessionAdmin = session({
  ...sessionOptions,
  name: 'admin.sid',
});

export const attachAdminToLocals = (req, res, next) => {
  res.locals.admin = req.session.admin || null;
  next();
};
