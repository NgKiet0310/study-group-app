import express from "express";
import {  createRoom, updateRoom, updateRoomPartial, deleteRoom, getRoomById } from "../../../controllers/api/admin/room.controller.js";
const router = express.Router();

router.post('/rooms', createRoom);
router.get('/rooms/:id',getRoomById);
router.put('/rooms/:id', updateRoom);
router.patch('/rooms/:id', updateRoomPartial);
router.delete('/rooms/:id', deleteRoom);

export default router;