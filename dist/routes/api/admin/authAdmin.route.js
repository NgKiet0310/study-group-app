import express from "express";
import { login, logout, refresh } from "../../../controllers/api/admin/adminAuth.controller.js";
const router = express.Router();
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
export default router;
//# sourceMappingURL=authAdmin.route.js.map