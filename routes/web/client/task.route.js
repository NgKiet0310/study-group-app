import express from "express";
import { 
  showTaskRoom, 
  createTask, 
  updateTask, 
  deleteTask 
} from "../../../controllers/web/client/task.controller.js";
import { checkRoomAccess } from "../../../middleware/checkRoom.js";
import { taskValidator } from "../../../middleware/validators/client/taskClientValidator.js";
const router = express.Router();
router.get("/room/:id/tasks", checkRoomAccess, showTaskRoom);
router.post("/room/:id/tasks", checkRoomAccess, taskValidator, createTask);
router.post("/room/:id/tasks/:taskId", checkRoomAccess, taskValidator, updateTask);
router.post("/room/:id/tasks/:taskId/delete", checkRoomAccess, deleteTask);

export default router;