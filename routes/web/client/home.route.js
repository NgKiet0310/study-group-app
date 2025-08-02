import express from "express";
import { showHomePage } from "../../../controllers/web/client/home.controller.js";
import isAuthenticated from "../../../middleware/isAuthenticated.js";
import { noCache } from "../../../middleware/nocache.js";

const router = express.Router();

router.get("/home" ,isAuthenticated, noCache,showHomePage);

export default router;
