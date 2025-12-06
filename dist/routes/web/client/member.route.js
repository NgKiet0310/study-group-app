import express from "express";
import { deleteMember, showRoomMembers } from "../../../controllers/web/client/member.controller.js";
import { checkRoomAccess } from "../../../middleware/checkRoom.js";
const router = express.Router();
router.get("/room/:id/members", checkRoomAccess, showRoomMembers);
router.post("/room/:roomId/delete/member/:memberId", deleteMember);
export default router;
//# sourceMappingURL=member.route.js.map