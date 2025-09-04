import express from "express";
import { getRooms, createRoom, updateRoom, updateRoomPartial, deleteRoom, getRoomById } from "../../../controllers/api/admin/room.controller.ts";
const router = express.Router();

router.get('/rooms',getRooms);
router.post('/rooms', createRoom);
router.get('/rooms/:id',getRoomById);
router.put('/rooms/:id', updateRoom);
router.patch('/rooms/:id', updateRoomPartial);
router.delete('/rooms/:id', deleteRoom);

export default router;