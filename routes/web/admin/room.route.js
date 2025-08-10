import express from "express";
import { showRooms, showCreateForm, createRoom, deleteRoom, showEditRoom, editRoom, showRoomDetail } from "../../../controllers/web/admin/room.controller.js";
import { validateRoom } from "../../../middleware/validators/roomValidator.js";
const router = express.Router();

router.get('/', showRooms);
router.get('/create' ,showCreateForm);
router.post('/create', createRoom, validateRoom);
router.get('/edit/:id', showEditRoom);
router.post('/edit/:id', editRoom, validateRoom);
router.get('/detail/:id', showRoomDetail);
router.post('/delete/:id', deleteRoom );
export default router;