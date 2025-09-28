import Room from "../../../models/Room.js";
import Message from "../../../models/Message.js";

export const showRoom = async (req, res) => {
  try {
    const roomId = req.params.id;
    const room = await Room.findById(roomId).populate("admin members.user");
    if (!room) {
      return res.status(404).render("client/pages/home", { 
        error: "Room not found",
        activeTab: "chat"
      });
    }
    const messages = await Message.find({ room: roomId })
    .populate("sender")
    .sort({ createdAt: 1 });
    res.render("client/pages/room/room", { 
      room,
      messages ,
      activeTab: "chat"
    });
  } catch (error) {
    console.error("Something wrong in showRoom", error);
    res.status(500).render("client/pages/home", { error: "Server error" });
  }
}

export const showCreateRoom = (req, res) => {
    res.render("client/pages/room/create-room");
}