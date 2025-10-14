import express from "express";
import { createTask, deleteTask, editTask, showCreateForm, showDetailTask, showEditForm, showTasks } from "../../../controllers/web/admin/task.controller.js";
import { validateTask } from "../../../middleware/validators/taskValidator.js";
const router = express.Router();

router.get('/', showTasks);
router.get('/create', showCreateForm);
router.post('/create', validateTask ,createTask);
router.get('/edit/:id', showEditForm);
router.post('/edit/:id',validateTask ,editTask);
router.get('/detail/:id',showDetailTask);
router.post('/delete/:id', deleteTask);
export default router;