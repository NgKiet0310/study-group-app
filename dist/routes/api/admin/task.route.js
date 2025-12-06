import express from "express";
import { getTasks, createTask, getTaskById, updateTask, updateTaskPartial, deleteTask } from "../../../controllers/api/admin/task.controller";
const router = express.Router();
router.get('/tasks', getTasks);
router.post('/tasks', createTask);
router.get('/tasks/:id', getTaskById);
router.put('/tasks/:id', updateTask);
router.patch('/tasks/:id', updateTaskPartial);
router.delete('/tasks/:id', deleteTask);
export default router;
//# sourceMappingURL=task.route.js.map