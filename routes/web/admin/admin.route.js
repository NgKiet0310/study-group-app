import express from 'express';
const router = express.Router();
import { showAdminPage } from '../../../controllers/web/admin/admin.controller.js';
import { noCache } from '../../../middleware/nocache.js';
import isAdmin from '../../../middleware/isAdmin.js';
import { showSchedules } from '../../../controllers/web/admin/schedule.controller.js';

router.get("/", showAdminPage, isAdmin ,noCache);
router.get("/manage-schedules", showSchedules);

export default router;
