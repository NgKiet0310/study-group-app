import express from "express";
import { getTasks, createTask, getTaskById, updateTask, updateTaskPartial, deleteTask } from "../../../controllers/api/admin/task.controller.ts";
import { validateTask } from "../../../middleware/validators/taskValidator.js";
const router = express.Router();


router.get('/tasks',getTasks);
router.post('/tasks', validateTask, createTask);
router.get('/tasks/:id',getTaskById);
router.put('/tasks/:id', updateTask, validateTask);
router.patch('/tasks/:id', updateTaskPartial);
router.delete('/tasks/:id', deleteTask);

export default router;