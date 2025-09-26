import  Room  from "../../../models/Room.js";

export const showRoom = async (req, res) => {
  try {
    const roomId = req.params.id;
    const room = await Room.findById(roomId).populate("admin members.user");
    if (!room) {
      return res.status(404).render("client/pages/", { message: "Room not found" });
    }

    // const tasks = await Task.find({ room: roomId }).sort({ createdAt: -1 });
    // const schedules = await Schedule.find({ room: roomId }).sort({ createdAt: 1 });
    // const notes = await Note.find({ room: roomId }).sort({ updatedAt: -1 });
    // const files = await File.find({ room: roomId }).populate("uploadedBy","username").sort({ uploadedAt: -1 });
    // const messages = await Message.find({ room: roomId }).populate("sender") .sort({ createdAt: 1 });

    res.render("client/pages/room/room", { 
      room,
    });
  } catch (error) {
    console.error("Something wrong in showRoom", error);
    res.status(500).render("client/pages/home", { error: "Server error" });
  }
};

export const showCreateRoom = (req, res) => {
    res.render("client/pages/room/create-room");
}