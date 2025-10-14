import Room from "../../../models/Room.js";
import Task from "../../../models/Task.js";
import { formatDate } from "../../../helpers/dateHelper.js";

export const showTaskRoom = async (req, res) => {
  try {
    const roomId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search;
    const limit = 6; 
    const skip = (page - 1) * limit;
    const room = await Room.findById(roomId).populate("admin members.user");
    if (!room) {
      return res.status(404).render("client/pages/404", { message: "Room not found" });
    }

    const query = { room: roomId};
    if(search){
      query.title = {$regex: search, $options: 'i'};
    }

    const totalTasks = await Task.countDocuments({ room: roomId});
    const totalPages = Math.ceil(totalTasks / limit);
    const tasks = await Task.find(query)
      .populate("createdBy", "username")
      .populate("assignedTo", "username")
      .sort({ createdAt: -1 });

    const now = new Date();
    const formattedTasks = tasks.map((t) => {
      let statusText = "Pending";
      if (t.status === "completed") statusText = "Completed";
      else if (t.status === "pending" && new Date(t.dueDate) < now) statusText = "Overdue";
      else if (t.status === "in-progress") statusText = "In progress";

      return {
        ...t.toObject(),
        statusText,
        dueDate: t.dueDate
          ? formatDate(t.dueDate, {day: "2-digit", month: "2-digit", year: "numeric"})
          : "Không có hạn",
        createdAt: formatDate(t.createdAt),
        createdBy: t.createdBy?.username || "N/A",
        assignedTo: t.assignedTo?.map((u) => u.username).join(", ") || "Chưa giao",
      };
    });

    res.render("client/pages/room/room", {
      room,
      activeTab: "tasks",
      user: req.session.user,
      tasks: formattedTasks,
      page,
      totalPages,
      limit,
      search
    });
  } catch (err) {
    console.error("Error in showTaskRoom:", err);
    res.status(500).render("client/pages/500", { message: "Server error" });
  }
};
