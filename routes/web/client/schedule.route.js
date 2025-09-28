import express from "express";
import { showScheduleRoom } from "../../../controllers/web/client/schedule.controller.js";
const router = express.Router();
router.get("/room/:id/schedules", showScheduleRoom);

export default router;    