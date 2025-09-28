import express from "express";
import { showTaskRoom } from "../../../controllers/web/client/task.controller.js";
const router = express.Router();
router.get("/room/:id/tasks", showTaskRoom);
export default router;