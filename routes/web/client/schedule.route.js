import express from "express";
import { showScheduleRoom } from "../../../controllers/web/client/schedule.controller.js";
const router = express.Router();
import { checkRoomAccess } from "../../../middleware/checkRoom.js";

router.get("/room/:id/schedules", checkRoomAccess ,showScheduleRoom);

export default router;    