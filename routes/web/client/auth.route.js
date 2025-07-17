import express from "express";
const router = express.Router();

import { LoginForm, RegisterForm, register } from "../../../controllers/web/client/auth.controller.js";

router.get("/login", LoginForm);
router.get("/register", RegisterForm);
router.post("/register", register);

export default router;
