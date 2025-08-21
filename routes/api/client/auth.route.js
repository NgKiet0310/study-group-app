import express from "express";
const router = express.Router();
import { register, login, refresh, logout } from "../../../controllers/api/client/auth.controller.js";

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router ;