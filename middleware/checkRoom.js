import Room from "../models/Room.js";

export const checkRoomAccess = async (req, res, next) => {
  try {
    const roomId = req.params.roomId || req.params.id;
    const userId = req.session.user?._id;
  
    const room = await Room.findById(roomId).populate("members.user", "username");
    if (!room) {
      return res.status(404).render("client/pages/404", { message: "Room not found" });
    }

    const isAdmin = room.admin.toString() === userId.toString();
    const isMember = room.members.some(
      (m) => m.user?._id.toString() === userId.toString()  
    );

    if (!isAdmin && !isMember) {
      return res.redirect("/?error=You do not have access to this room");
    }
    req.room = room;
    next();
  } catch (err) {
    console.error("Error in checkRoomAccess:", err);
    res.status(500).render("client/pages/500", { message: "Error Server" });
  }
};