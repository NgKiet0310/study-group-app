import session from 'express-session';

export const sessionConfig = session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
});
