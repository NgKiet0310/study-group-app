import Room from "../../../models/Room.js";
import Task from "../../../models/Task.js";
import { formatDate } from "../../../helpers/dateHelper.js";

// Hiển thị danh sách task
export const showTaskRoom = async (req, res) => {
  try {
    const roomId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || '';
    const limit = 6;
    const skip = (page - 1) * limit;

    const room = await Room.findById(roomId).populate("admin members.user");
    if (!room) {
      return res.status(404).render("client/pages/404", { message: "Room not found" });
    }

    // Query tìm kiếm
    const query = { room: roomId };
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const totalTasks = await Task.countDocuments(query);
    const totalPages = Math.ceil(totalTasks / limit);

    const tasks = await Task.find(query)
      .populate("createdBy", "username")
      .populate("assignedTo", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const now = new Date();
    const formattedTasks = tasks.map((t) => {
      // Map status từ database sang display text
      let statusText = 'Pending';
      let displayStatus = 'Pending';
      
      if (t.status === 'completed') {
        statusText = 'Completed';
        displayStatus = 'Completed';
      } else if (t.status === 'in-progress') {
        statusText = 'In progress';
        displayStatus = 'In progress';
      } else if (t.status === 'pending') {
        displayStatus = 'Pending';
        // Kiểm tra overdue cho task pending
        if (t.dueDate && new Date(t.dueDate) < now) {
          statusText = 'Overdue';
        } else {
          statusText = 'Pending';
        }
      }

      // assignedTo là array nên cần xử lý
      const assignedToNames = t.assignedTo && t.assignedTo.length > 0
        ? t.assignedTo.map(u => u.username).join(", ")
        : "Chưa giao";
      
      const assignedToIds = t.assignedTo && t.assignedTo.length > 0
        ? t.assignedTo.map(u => u._id.toString())
        : [];

      return {
        _id: t._id,
        title: t.title,
        description: t.description || '',
        dueDate: t.dueDate ? t.dueDate.toISOString().slice(0, 16) : '',
        dueDateDisplay: t.dueDate 
          ? formatDate(t.dueDate, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) 
          : "Không có hạn",
        status: displayStatus, // Giá trị để hiển thị trong select
        statusText, // Giá trị để hiển thị badge
        createdAt: formatDate(t.createdAt),
        createdBy: t.createdBy?.username || "Unknown",
        assignedTo: assignedToNames,
        assignedToId: assignedToIds.length > 0 ? assignedToIds[0] : null, // Lấy người đầu tiên cho select
        assignedToIds: assignedToIds, // Danh sách đầy đủ
        isCompleted: t.status === 'completed' // Flag để check task đã hoàn thành
      };
    });

    // Lấy success/error message từ session
    const success = req.session.success;
    const error = req.session.error;
    delete req.session.success;
    delete req.session.error;

    res.render("client/pages/room/room", {
      room,
      activeTab: "tasks",
      user: req.session.user,
      tasks: formattedTasks,
      page,
      totalPages,
      search,
      success,
      error
    });
  } catch (err) {
    console.error("Error in showTaskRoom:", err);
    res.status(500).render("client/pages/500", { message: "Server error" });
  }
};

// Tạo task mới
export const createTask = async (req, res) => {
  try {
    const roomId = req.params.id;
    const { title, description, dueDate, status, assignedTo } = req.body;

    const room = await Room.findById(roomId).populate("admin members.user");
    if (!room) {
      return res.status(404).render("client/pages/404", { message: "Room not found" });
    }

    // Kiểm tra quyền (admin hoặc host)
    const userId = req.session.user._id;
    const isAdmin = room.admin._id.toString() === userId.toString();
    const isHost = room.members?.some(m => 
      m.user._id.toString() === userId.toString() && m.role === 'host'
    );

    if (!isAdmin && !isHost) {
      req.session.error = 'Bạn không có quyền tạo task';
      return res.redirect(`/room/${roomId}?tab=tasks`);
    }

    // Xử lý assignedTo - có thể là array hoặc single value
    let assignedToArray = [];
    if (assignedTo && assignedTo.trim()) {
      const allMemberIds = [
        room.admin._id.toString(),
        ...(room.members || []).map(m => m.user._id.toString())
      ];
      
      // Kiểm tra người được giao có thuộc room không
      if (!allMemberIds.includes(assignedTo.trim())) {
        req.session.error = 'Người được giao không thuộc room này';
        return res.redirect(`/room/${roomId}?tab=tasks`);
      }
      
      assignedToArray = [assignedTo.trim()];
    }

    // Map status từ form về format database
    let dbStatus = 'pending';
    if (status === 'In progress') {
      dbStatus = 'in-progress';
    } else if (status === 'Completed') {
      dbStatus = 'completed';
    } else if (status === 'Pending') {
      dbStatus = 'pending';
    }

    // Tạo task mới
    const newTask = new Task({
      title: title.trim(),
      description: description?.trim() || '',
      dueDate: dueDate ? new Date(dueDate) : null,
      status: dbStatus,
      room: roomId,
      createdBy: userId,
      assignedTo: assignedToArray
    });

    await newTask.save();

    req.session.success = 'Tạo task thành công!';
    res.redirect(`/room/${roomId}?tab=tasks`);
  } catch (err) {
    console.error("Error in createTask:", err);
    req.session.error = 'Có lỗi xảy ra khi tạo task: ' + err.message;
    res.redirect(`/room/${req.params.id}?tab=tasks`);
  }
};

// Cập nhật task
export const updateTask = async (req, res) => {
  try {
    const roomId = req.params.id;
    const taskId = req.params.taskId;
    const { title, description, dueDate, status, assignedTo } = req.body;

    const room = await Room.findById(roomId).populate("admin members.user");
    if (!room) {
      return res.status(404).render("client/pages/404", { message: "Room not found" });
    }

    const task = await Task.findById(taskId);
    if (!task || task.room.toString() !== roomId) {
      req.session.error = 'Task không tồn tại';
      return res.redirect(`/room/${roomId}?tab=tasks`);
    }

    // Kiểm tra task đã hoàn thành thì không cho sửa
    if (task.status === 'completed') {
      req.session.error = 'Không thể sửa task đã hoàn thành';
      return res.redirect(`/room/${roomId}?tab=tasks`);
    }

    // Kiểm tra quyền
    const userId = req.session.user._id;
    const isAdmin = room.admin._id.toString() === userId.toString();
    const isHost = room.members?.some(m => 
      m.user._id.toString() === userId.toString() && m.role === 'host'
    );

    if (!isAdmin && !isHost) {
      req.session.error = 'Bạn không có quyền sửa task';
      return res.redirect(`/room/${roomId}?tab=tasks`);
    }

    // Xử lý assignedTo
    let assignedToArray = [];
    if (assignedTo && assignedTo.trim()) {
      const allMemberIds = [
        room.admin._id.toString(),
        ...(room.members || []).map(m => m.user._id.toString())
      ];
      
      if (!allMemberIds.includes(assignedTo.trim())) {
        req.session.error = 'Người được giao không thuộc room này';
        return res.redirect(`/room/${roomId}?tab=tasks`);
      }
      
      assignedToArray = [assignedTo.trim()];
    }

    // Map status từ form về format database
    let dbStatus = 'pending';
    if (status === 'In progress') {
      dbStatus = 'in-progress';
    } else if (status === 'Completed') {
      dbStatus = 'completed';
    } else if (status === 'Pending') {
      dbStatus = 'pending';
    }

    // Cập nhật task
    task.title = title.trim();
    task.description = description?.trim() || '';
    task.dueDate = dueDate ? new Date(dueDate) : null;
    task.status = dbStatus;
    task.assignedTo = assignedToArray;

    await task.save();

    req.session.success = 'Cập nhật task thành công!';
    res.redirect(`/room/${roomId}?tab=tasks`);
  } catch (err) {
    console.error("Error in updateTask:", err);
    req.session.error = 'Có lỗi xảy ra khi cập nhật task: ' + err.message;
    res.redirect(`/room/${req.params.id}?tab=tasks`);
  }
};

// Xóa task
export const deleteTask = async (req, res) => {
  try {
    const roomId = req.params.id;
    const taskId = req.params.taskId;

    const room = await Room.findById(roomId).populate("admin members.user");
    if (!room) {
      return res.status(404).render("client/pages/404", { message: "Room not found" });
    }

    const task = await Task.findById(taskId);
    if (!task || task.room.toString() !== roomId) {
      req.session.error = 'Task không tồn tại';
      return res.redirect(`/room/${roomId}?tab=tasks`);
    }

    // Kiểm tra task đã hoàn thành thì không cho xóa
    if (task.status === 'completed') {
      req.session.error = 'Không thể xóa task đã hoàn thành';
      return res.redirect(`/room/${roomId}?tab=tasks`);
    }

    // Kiểm tra quyền
    const userId = req.session.user._id;
    const isAdmin = room.admin._id.toString() === userId.toString();
    const isHost = room.members?.some(m => 
      m.user._id.toString() === userId.toString() && m.role === 'host'
    );

    if (!isAdmin && !isHost) {
      req.session.error = 'Bạn không có quyền xóa task';
      return res.redirect(`/room/${roomId}?tab=tasks`);
    }

    await Task.findByIdAndDelete(taskId);

    req.session.success = 'Xóa task thành công!';
    res.redirect(`/room/${roomId}?tab=tasks`);
  } catch (err) {
    console.error("Error in deleteTask:", err);
    req.session.error = 'Có lỗi xảy ra khi xóa task: ' + err.message;
    res.redirect(`/room/${req.params.id}?tab=tasks`);
  }
};