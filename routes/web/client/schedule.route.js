import express from "express";
import { 
  showScheduleRoom, 
  createSchedule,
  updateSchedule,
  deleteSchedule
} from "../../../controllers/web/client/schedule.controller.js";
import { scheduleValidator } from "../../../middleware/validators/client/scheduleClientValidator.js";
import { checkRoomAccess } from "../../../middleware/checkRoom.js";

const router = express.Router();
router.get("/room/:id/schedules", checkRoomAccess, showScheduleRoom);
router.post("/room/:id/schedules", checkRoomAccess, scheduleValidator, createSchedule);
router.post("/room/:id/schedules/:scheduleId", checkRoomAccess, scheduleValidator, updateSchedule);
router.post("/room/:id/schedules/:scheduleId/delete", checkRoomAccess, deleteSchedule);

export default router;