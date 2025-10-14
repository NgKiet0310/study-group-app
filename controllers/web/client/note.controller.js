import Note from "../../../models/Note.js";
import { formatDate } from "../../../helpers/dateHelper.js";
import Room from "../../../models/Room.js";

export const showNoteRoom = async(req, res) => {
    try {
        const roomId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = 6;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;
        const room = await Room.findById(roomId).populate("admin","username");
        if(!room){
            res.render("client/pages/404",{message: "Room not found"});
        }
        
        const query = {room: roomId};
        if(search){
          query.title = {$regex : search, $options : 'i' };
        }

        const totalNotes = await Note.countDocuments({ room: roomId});
        const totalPages = Math.ceil(totalNotes / limit);
        const notes = await Note.find(query)
        .populate("createdBy","username")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const formattedNotes = notes.map((n) => ({
      _id: n._id,
      title: n.title,
      content: n.content,
      isPublic: n.isPublic,
      createdAt: formatDate(n.createdAt),
      createdBy: n.createdBy ? n.createdBy.username : "Unknown",
    }));

    res.render("client/pages/room/room", {
    room,
    activeTab: "notes",
    notes: formattedNotes,
    user: req.session.user,
    page,
    totalPages,
    limit,
    search
    });
  } catch (error) {
    console.error("Error in showNoteRoom:", error);
    res.status(500).render("client/pages/500", { message: "Server error" });
  }
};