import express from "express";
import { getSchedules, getScheduleById, createSchedule, updateSchedule, updateSchedulePartial,deleteSchedule } from "../../../controllers/api/admin/schedule.controller.js";
const router = express.Router();

router.get('/schedules',getSchedules);
router.post('/schedules', createSchedule);
router.get('/schedules/:id',getScheduleById);
router.put('/schedules/:id', updateSchedule);
router.patch('/schedules/:id', updateSchedulePartial);
router.delete('/schedules/:id', deleteSchedule);

export default router;