import Room from "../../../models/Room.js";
import File from "../../../models/File.js";

export const showFilesRoom = async (req, res) => {
  try {
    const roomId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;
    const room = await Room.findById(roomId).populate("members.user");
    if(!room){
      res.render("client/pages/404", {message : "Room not found"});
    }

    const query = {room: roomId};
    if(search){
      query.fileName = {$regex: search, $options: 'i'}
    }

    const totalFiles = await File.countDocuments({ room: roomId});
    const totalPages = Math.ceil(totalFiles / limit);
    const files = await File.find(query)
      .populate("uploadedBy", "username")
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limit)


    res.render("client/pages/room/room", {
      room,
      files,
      user: req.session.user,
      activeTab: "files",
      page,
      totalPages,
      limit,
      search
    });
  } catch (error) {
    console.error("Error in showFilesRoom:", error);
    res.status(500).render("client/pages/home", { error: "Server error" });
  }
};