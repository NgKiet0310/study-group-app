import express from 'express';
import {
  showSchedules,
  showCreateForm,
  createSchedule,
  showEditForm,
  updateSchedule,
  deleteSchedule,
  showScheduleDetail
} from '../../../controllers/web/admin/schedule.controller.js';


const router = express.Router();

router.get('/', showSchedules);
router.get('/create' ,showCreateForm);
router.post('/create', createSchedule);
router.get('/edit/:id', showEditForm);
router.post('/edit/:id', updateSchedule);
router.get('/detail/:id', showScheduleDetail);
router.post('/delete/:id', deleteSchedule);

export default router;