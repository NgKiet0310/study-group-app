import express from "express";
const router = express.Router();

import { Login, LoginForm, Logout, RegisterForm, register } from "../../../controllers/web/client/auth.controller.js";

router.get("/login", LoginForm);
router.get("/register", RegisterForm);
router.post("/register", register);
router.post("/login", Login);
router.get("/logout",Logout);

export default router;
