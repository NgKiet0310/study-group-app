import express from "express";
import { showHomePage } from "../../../controllers/web/client/home.controller.js";

const router = express.Router();

router.get("/home", showHomePage);

export default router;
