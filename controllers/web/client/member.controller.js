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
      name: m.user?.username || "Không xác định",
      contact: m.user?.username || "Không xác định",
      role: m.role || "member"
    }));

    // Thêm admin nếu chưa có trong members
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
      tasks: []
    });
  } catch (error) {
    console.error("Error in showRoomMembers:", error);
    res.redirect("/room?error=Không thể tải danh sách thành viên");
  }
};