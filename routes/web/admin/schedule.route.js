import express from 'express';
import {
  showSchedules,
  showCreateForm,
  createSchedule,
  showEditForm,
  updateSchedule,
  deleteSchedule
} from '../../../controllers/web/admin/schedule.controller.js';


const router = express.Router();

router.get('/', showSchedules);
router.get('/create' ,showCreateForm);
router.post('/create', createSchedule);
router.get('/edit/:id', showEditForm);
router.post('/edit/:id', updateSchedule);
router.post('/delete/:id', deleteSchedule);

export default router;