import Room from "../../../models/Room.js";
import Schedule from "../../../models/Schedule.js";
import { formatDate } from "../../../helpers/dateHelper.js";
export const showScheduleRoom = async (req, res) => {
  try {
    const roomId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || '';
    const limit = 3;
    const skip = (page - 1) * limit;
    
    const room = await Room.findById(roomId).populate("admin members.user");
    if (!room) {
      return res.status(404).render("client/pages/404", { message: "Room not found" });
    }

    const query = { room: roomId };
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const totalSchedules = await Schedule.countDocuments(query);
    const totalPages = Math.ceil(totalSchedules / limit);
    const schedules = await Schedule.find(query)
      .populate("createdBy", "username")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const now = new Date();
    const formattedSchedules = schedules.map((s) => {
      let status = "Comming soon";
      if (s.endTime && s.endTime < now) status = "Completed";
      else if (s.startTime <= now && (!s.endTime || s.endTime >= now)) status = "In progress";

      // Format datetime cho input datetime-local
      const formatDateTimeLocal = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      return {
        _id: s._id,
        title: s.title,
        description: s.description,
        startTime: formatDateTimeLocal(s.startTime),
        endTime: s.endTime ? formatDateTimeLocal(s.endTime) : null,
        createdAt: formatDate(s.createdAt),
        createdBy: s.createdBy ? s.createdBy.username : "Unknown",
        participants: s.participants ? s.participants.map(p => p.toString()) : [],
        status,
      };
    });

    const success = req.session.success;
    delete req.session.success;

    res.render("client/pages/room/room", {
      room,
      activeTab: "schedules",
      schedules: formattedSchedules,
      user: req.session.user,
      page,
      totalPages,
      limit,
      search,
      success: success || null
    });
  } catch (err) {
    console.error("Error in showScheduleRoom:", err);
    res.status(500).render("client/pages/500", { message: "Server error" });
  }
};
export const createSchedule = async (req, res) => {
  try {
    const roomId = req.params.id;
    const { title, description, startTime, endTime, participants } = req.body;
    
    const room = await Room.findById(roomId).populate('admin members.user');
    if (!room) {
      return res.status(404).render('client/pages/404', { message: 'Room not found' });
    }

    const user = req.session.user;
    const isAdmin = room.admin._id.toString() === user._id.toString();
    const isHost = room.members.some(m => m.user._id.toString() === user._id.toString() && m.role === 'host');
    const canManage = isAdmin || isHost;

    if (!canManage) {
      return res.status(403).render('client/pages/403', { message: 'Bạn không có quyền tạo lịch' });
    }
    let participantIds = [];
    if (participants) {
      participantIds = Array.isArray(participants) ? participants : [participants];
    }

    const newSchedule = new Schedule({
      room: roomId,
      title: title.trim(),
      description: description ? description.trim() : '',
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      createdBy: user._id,
      participants: participantIds
    });

    await newSchedule.save();

    req.session.success = 'Tạo lịch thành công!';
    res.redirect(`/room/${roomId}/schedules`);
  } catch (err) {
    console.error('Error creating schedule:', err);
    
    const room = await Room.findById(req.params.id).populate('admin members.user');
    const schedules = await Schedule.find({ room: req.params.id })
      .populate("createdBy", "username")
      .sort({ createdAt: -1 })
      .limit(3);

    const now = new Date();
    const formattedSchedules = schedules.map((s) => {
      let status = "Comming soon";
      if (s.endTime && s.endTime < now) status = "Completed";
      else if (s.startTime <= now && (!s.endTime || s.endTime >= now)) status = "In progress";

      return {
        _id: s._id,
        title: s.title,
        description: s.description,
        startTime: formatDate(s.startTime),
        endTime: s.endTime ? formatDate(s.endTime) : null,
        createdAt: formatDate(s.createdAt),
        createdBy: s.createdBy ? s.createdBy.username : "Unknown",
        status,
      };
    });

    res.render('client/pages/room/room', {
      room,
      activeTab: 'schedules',
      schedules: formattedSchedules,
      user: req.session.user,
      page: 1,
      totalPages: 1,
      search: '',
      error: 'Có lỗi xảy ra khi tạo lịch',
      formData: req.body,
      showCreateModal: true
    });
  }
};

export const updateSchedule = async (req, res) => {
  try {
    const { id: roomId, scheduleId } = req.params;
    const { title, description, startTime, endTime, participants } = req.body;

    const room = await Room.findById(roomId).populate('admin members.user');
    if (!room) {
      return res.status(404).render('client/pages/404', { message: 'Room not found' });
    }

    const schedule = await Schedule.findOne({ _id: scheduleId, room: roomId });
    if (!schedule) {
      return res.status(404).render('client/pages/404', { message: 'Schedule not found' });
    }

    const user = req.session.user;
    const isAdmin = room.admin._id.toString() === user._id.toString();
    const isHost = room.members.some(m => m.user._id.toString() === user._id.toString() && m.role === 'host');
    const canManage = isAdmin || isHost;

    if (!canManage) {
      return res.status(403).render('client/pages/403', { message: 'Bạn không có quyền sửa lịch' });
    }
    let participantIds = [];
    if (participants) {
      participantIds = Array.isArray(participants) ? participants : [participants];
    }
    schedule.title = title.trim();
    schedule.description = description ? description.trim() : '';
    schedule.startTime = new Date(startTime);
    schedule.endTime = endTime ? new Date(endTime) : null;
    schedule.participants = participantIds;

    await schedule.save();

    req.session.success = 'Cập nhật lịch thành công!';
    res.redirect(`/room/${roomId}/schedules`);
  } catch (err) {
    console.error('Error updating schedule:', err);
    
    const room = await Room.findById(req.params.id).populate('admin members.user');
    const schedule = await Schedule.findById(req.params.scheduleId);
    
    const allMembers = [
      { _id: room.admin._id, username: room.admin.username, role: 'admin' },
      ...room.members.map(m => ({ _id: m.user._id, username: m.user.username, role: m.role }))
    ];

    res.render('client/pages/room/partials/schedule/form-edit', {
      room,
      schedule,
      user: req.session.user,
      allMembers,
      formData: req.body,
      error: 'Có lỗi xảy ra khi cập nhật lịch'
    });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    const { id: roomId, scheduleId } = req.params;

    const room = await Room.findById(roomId).populate('admin members.user');
    if (!room) {
      return res.status(404).render('client/pages/404', { message: 'Room not found' });
    }

    const schedule = await Schedule.findOne({ _id: scheduleId, room: roomId });
    if (!schedule) {
      return res.status(404).render('client/pages/404', { message: 'Schedule not found' });
    }

    const user = req.session.user;
    const isAdmin = room.admin._id.toString() === user._id.toString();
    const isHost = room.members.some(m => m.user._id.toString() === user._id.toString() && m.role === 'host');
    const canManage = isAdmin || isHost;

    if (!canManage) {
      return res.status(403).render('client/pages/403', { message: 'Bạn không có quyền xóa lịch' });
    }

    await Schedule.findByIdAndDelete(scheduleId);

    req.session.success = 'Xóa lịch thành công!';
    res.redirect(`/room/${roomId}/schedules`);
  } catch (err) {
    console.error('Error deleting schedule:', err);
    req.session.error = 'Có lỗi xảy ra khi xóa lịch';
    res.redirect(`/room/${req.params.id}?tab=schedules`);
  }
};