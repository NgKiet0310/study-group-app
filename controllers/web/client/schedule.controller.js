import Room from "../../../models/Room.js";
import Schedule from "../../../models/Schedule.js";

export const showScheduleRoom = async (req, res) => {
  try {
    const roomId = req.params.id;
    const room = await Room.findById(roomId).populate("admin members.user");
    if (!room) {
      return res
        .status(404)
        .render("client/pages/404", { message: "Room not found" });
    }

    const schedules = await Schedule.find({ room: roomId })
      .populate("createdBy", "username")
      .sort({ createdAt: -1 });

    const now = new Date();
    const formattedSchedules = schedules.map((s) => {
      let status = "Sắp diễn ra";
      if (s.endTime < now) status = "Đã hoàn thành";
      else if (s.startTime <= now && s.endTime >= now) status = "Đang diễn ra";

      return {
        _id: s._id,
        title: s.title,
        description: s.description,
        startTime: s.startTime ? s.startTime.toLocaleString("vi-VN") : "",
        endTime: s.endTime ? s.endTime.toLocaleString("vi-VN") : "",
        createdAt: s.createdAt ? s.createdAt.toLocaleString("vi-VN") : "",
        createdBy: s.createdBy ? s.createdBy.username : "Unknown",
        status,
      };
    });

    res.render("client/pages/room/room", {
      room,
      activeTab: "schedules",
      schedules: formattedSchedules,
    });
  } catch (err) {
    console.error("Error in showScheduleRoom:", err);
    res
      .status(500)
      .render("client/pages/500", { message: "Server error" });
  }
};
