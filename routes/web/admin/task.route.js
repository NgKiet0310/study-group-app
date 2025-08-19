import express from "express";
import { createTask, deleteTask, editTask, showCreateForm, showEditForm, showTasks } from "../../../controllers/web/admin/task.controller.js";
import { validateTask } from "../../../middleware/validators/taskValidator.js";
const router = express.Router();

router.get('/', showTasks);
router.get('/create', showCreateForm);
router.post('/create', createTask ,validateTask);
router.get('/edit/:id', showEditForm);
router.post('/edit/:id', editTask, validateTask);
router.post('/delete/:id', deleteTask);
export default router;