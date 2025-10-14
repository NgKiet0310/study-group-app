import Room from "../../../models/Room.js";
import Schedule from "../../../models/Schedule.js";
import { formatDate } from "../../../helpers/dateHelper.js";

export const showScheduleRoom = async (req, res) => {
  try {
    const roomId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || '';
    const limit = 3;
    const skip = (page - 1) * limit ;
    const room = await Room.findById(roomId).populate("admin members.user");
    if (!room) {
      return res
        .status(404)
        .render("client/pages/404", { message: "Room not found" });
    }

    const query = {room: roomId};
    if(search){
      query.title = {$regex: search, $options: 'i'};
    }

    const totalSchedules = await Schedule.countDocuments({room: roomId});
    const totalPages = Math.ceil(totalSchedules / limit );
    const schedules = await Schedule.find(query)
      .populate("createdBy", "username")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)

    const now = new Date();
    const formattedSchedules = schedules.map((s) => {
      let status = "Comming soon";
      if (s.endTime < now) status = "Completed";
      else if (s.startTime <= now && s.endTime >= now) status = "In progress";

      return {
        _id: s._id,
        title: s.title,
        description: s.description,
        startTime: formatDate(s.startTime),
        endTime: formatDate(s.endTime),
        createdAt: formatDate(s.createdAt),
        createdBy: s.createdBy ? s.createdBy.username : "Unknown",
        status,
      };
    });

    res.render("client/pages/room/room", {
      room,
      activeTab: "schedules",
      schedules: formattedSchedules,
      user: req.session.user,
      page,
      totalPages,
      limit,
      search
    });
  } catch (err) {
    console.error("Error in showScheduleRoom:", err);
    res
      .status(500)
      .render("client/pages/500", { message: "Server error" });
  }
};
