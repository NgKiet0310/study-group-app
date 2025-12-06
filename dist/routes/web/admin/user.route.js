import express from "express";
import { showUser, showCreateForm, showEditForm, createUser, editUser, showUserDetail, deleteUser } from "../../../controllers/web/admin/user.controller.js";
import { validateUser } from "../../../middleware/validators/uservalidator.js";
const router = express.Router();
router.get('/', showUser);
router.get('/create', showCreateForm);
router.post('/create', createUser, validateUser);
router.get('/edit/:id', showEditForm);
router.post('/edit/:id', editUser);
router.get('/detail/:id', showUserDetail);
router.post('/delete/:id', deleteUser);
export default router;
//# sourceMappingURL=user.route.js.map