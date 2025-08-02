import express from 'express';
import { showLoginForm, handleLogin, handleLogout } from '../../../controllers/web/admin/auth.controller.js';

const router = express.Router();

router.get('/login', showLoginForm);
router.post('/login', handleLogin);
router.get('/logout', handleLogout);

export default router;
