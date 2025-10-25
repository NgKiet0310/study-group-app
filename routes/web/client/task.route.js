import express from "express";
import { showTaskRoom } from "../../../controllers/web/client/task.controller.js";
const router = express.Router();
import { checkRoomAccess } from "../../../middleware/checkRoom.js";

router.get("/room/:id/tasks", checkRoomAccess ,showTaskRoom);
export default router;