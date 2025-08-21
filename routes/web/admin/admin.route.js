import express from 'express';
const router = express.Router();
import { showDashboard } from '../../../controllers/web/admin/admin.controller.js';
import { noCache } from '../../../middleware/nocache.js';
import isAdmin from '../../../middleware/isAdmin.js';

router.get("/", showDashboard, isAdmin ,noCache);

export default router;
