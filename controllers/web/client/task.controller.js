// controllers/web/client/task.controller.js
import Room from "../../../models/Room.js";
import Task from "../../../models/Task.js";

export const showTaskRoom = async (req, res) => {
  try {
    const roomId = req.params.id;
    const room = await Room.findById(roomId).populate("admin members.user");
    if (!room) {
      return res.status(404).render("client/pages/404", { message: "Room not found" });
    }

    const tasks = await Task.find({ room: roomId })
      .populate("createdBy", "username")
      .populate("assignedTo", "username")
      .sort({ createdAt: -1 });

    const now = new Date();
    const formattedTasks = tasks.map((t) => {
      let statusText = "Chưa bắt đầu";
      if (t.status === "completed") statusText = "Đã hoàn thành";
      else if (t.status === "pending" && new Date(t.dueDate) < now) statusText = "Quá hạn";
      else if (t.status === "in-progress") statusText = "Đang thực hiện";

      return {
        ...t.toObject(),
        statusText,
        dueDate: t.dueDate
          ? new Date(t.dueDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
          : "Không có hạn",
        createdAt: new Date(t.createdAt).toLocaleString("vi-VN"),
        createdBy: t.createdBy?.username || "N/A",
        assignedTo: t.assignedTo?.map((u) => u.username).join(", ") || "Chưa giao",
      };
    });

    res.render("client/pages/room/room", {
      room,
      activeTab: "tasks",
      tasks: formattedTasks,
    });
  } catch (err) {
    console.error("Error in showTaskRoom:", err);
    res.status(500).render("client/pages/500", { message: "Server error" });
  }
};
