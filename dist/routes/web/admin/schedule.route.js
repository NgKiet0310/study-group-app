import express from 'express';
import { showSchedules, showCreateForm, createSchedule, showEditForm, updateSchedule, deleteSchedule, showScheduleDetail } from '../../../controllers/web/admin/schedule.controller.js';
import { validateScheduleCreate } from '../../../middleware/validators/scheduleValidator.js';
const router = express.Router();
router.get('/', showSchedules);
router.get('/create', showCreateForm);
router.post('/create', validateScheduleCreate, createSchedule);
router.get('/edit/:id', showEditForm);
router.post('/edit/:id', validateScheduleCreate, updateSchedule);
router.get('/detail/:id', showScheduleDetail);
router.post('/delete/:id', deleteSchedule);
export default router;
//# sourceMappingURL=schedule.route.js.map