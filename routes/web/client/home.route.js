import express from "express";
import { profile, showHomePage, showRoom, updateProfile, showCreateRoom } from "../../../controllers/web/client/home.controller.js";
import { updateProfileValidator } from "../../../middleware/validators/profileValidator.js";

const router = express.Router();

router.get("/home" ,showHomePage);
router.get("/room/:id", showRoom);
router.get("/create-room", showCreateRoom);
router.get("/profile", profile);
router.post("/update_profile", updateProfileValidator ,updateProfile);
export default router;

