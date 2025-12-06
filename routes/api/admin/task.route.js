import express from "express";
import {  createTask, getTaskById, updateTask, updateTaskPartial, deleteTask } from "../../../controllers/api/admin/task.controller.js";
const router = express.Router();

router.post('/tasks', createTask);
router.get('/tasks/:id',getTaskById);
router.put('/tasks/:id', updateTask);
router.patch('/tasks/:id', updateTaskPartial);
router.delete('/tasks/:id', deleteTask);

export default router;