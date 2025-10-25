import Room from "../../../models/Room.js";

export const showRoomMembers = async (req, res) => {
  try {
    const roomId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const room = await Room.findById(roomId)
      .populate("members.user", "username")
      .populate("admin", "username");

    if (!room) {
      return res.render("client/pages/404", { message: "Room not found" });
    }

    let members = room.members.map(m => ({
      _id: m.user?._id,
      name: m.user?.username || "Không xác định",
      contact: m.user?.username || "Không xác định",
      role: m.role || "member"
    }));

    const adminExists = members.some(m => m.role === 'admin');
    if (!adminExists && room.admin?.username) {
      members.unshift({
        name: room.admin.username,
        contact: room.admin.username,
        role: "admin"
      });
    }

    if (search) {
      const q = search.toLowerCase();
      members = members.filter(m => 
        m.name.toLowerCase().includes(q) || 
        m.contact.toLowerCase().includes(q)
      );
    }

    const totalMembers = members.length;
    const totalPages = Math.ceil(totalMembers / limit);

    members = members.slice(skip, skip + limit);

    let success = req.session.success || null;
    let error = req.session.error || null;
    if (req.session.success) delete req.session.success; 
    if (req.session.error) delete req.session.error;

    // Debug tạm (xóa sau khi test): Log để check session
    console.log("Session success before clear:", success ? "Có message" : "Null");

    res.render("client/pages/room/room", {
      room,
      members,
      activeTab: "members",
      search,
      page,
      totalPages,
      limit,
      messages: [],
      notes: [],
      schedules: [],
      files: [],
      tasks: [],
      success,  
      error,
    });
  } catch (error) {
    console.error("Error in showRoomMembers:", error);
    req.session.error = "Không thể tải danh sách thành viên";  
    res.redirect("/room");  
  }
};

export const deleteMember = async(req, res) => {
  try {
    const {roomId, memberId} = req.params;
    const room = await Room.findById(roomId); 
    if(!room){
      return res.status(404).render("client/pages/404", {message: "Room not found"});
    }
    const isMember = room.members.some(m => m.user.toString() === memberId.toString());
    if(!isMember){
      req.session.error = "Member does not exist in this room";
      return res.redirect(`/room/${roomId}/members`);
    }
    room.members = room.members.filter(
      m => m.user.toString() !== memberId.toString()
    );
    await room.save();
    req.session.success = "Delete member successfully";
    res.redirect(`/room/${roomId}/members`);
  } catch (error) {
    console.error("Error deleting member", error);
    req.session.error = "Server ERROR";
    res.redirect(`/room/${roomId}/members`);
  }
}