import Room from "../../../models/Room.js";
import File from "../../../models/File.js";

export const showFilesRoom = async (req, res) => {
  try {
    const roomId = req.params.id;

    const room = await Room.findById(roomId).populate("members.user");

    const files = await File.find({ room: roomId })
      .populate("uploadedBy", "username")
      .sort({ uploadedAt: -1 });

    res.render("client/pages/room/room", {
      room,
      files,
      activeTab: "files"
    });
  } catch (error) {
    console.error("Error in showFilesRoom:", error);
    res.status(500).render("client/pages/home", { error: "Server error" });
  }
};
