import express from "express";
import { showRooms, showCreateForm, createRoom, deleteRoom, showEditRoom, editRoom, showRoomDetail } from "../../../controllers/web/admin/room.controller.js";
import { validateRoom } from "../../../middleware/validators/roomValidator.js";
const router = express.Router();

router.get('/', showRooms);
router.get('/create' ,showCreateForm);
router.post('/create', validateRoom ,createRoom);
router.get('/edit/:id', showEditRoom);
router.post('/edit/:id', validateRoom ,editRoom);
router.get('/detail/:id', showRoomDetail);
router.post('/delete/:id', deleteRoom );
export default router;