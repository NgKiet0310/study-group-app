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
    
    const room = await Room.findById(roomId).populate("admin members.user");
    if(!room){
      return res.status(404).render("client/pages/404", { message: "Room not found" });
    }
    
    const query = { room: roomId };
    if(search){
      query.title = { $regex: search, $options: 'i' };
    }

    const totalNotes = await Note.countDocuments(query);
    const totalPages = Math.ceil(totalNotes / limit);
    const notes = await Note.find(query)
      .populate("createdBy", "username")
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

    // Lấy success message từ session và xóa
    const success = req.session.success;
    delete req.session.success;

    res.render("client/pages/room/room", {
      room,
      activeTab: "notes",
      notes: formattedNotes,
      user: req.session.user,
      page,
      totalPages,
      limit,
      search,
      success: success || null
    });
  } catch (error) {
    console.error("Error in showNoteRoom:", error);
    res.status(500).render("client/pages/500", { message: "Server error" });
  }
};

export const createNote = async (req, res) => {
  try {
    const roomId = req.params.id;
    const { title, content, isPublic } = req.body;
    
    const room = await Room.findById(roomId).populate('admin members.user');
    if (!room) {
      return res.status(404).render('client/pages/404', { message: 'Room not found' });
    }

    const user = req.session.user;
    const isAdmin = room.admin._id.toString() === user._id.toString();
    const isHost = room.members.some(m => m.user._id.toString() === user._id.toString() && m.role === 'host');
    const canManage = isAdmin || isHost;

    if (!canManage) {
      return res.status(403).render('client/pages/403', { message: 'Bạn không có quyền tạo note' });
    }

    const newNote = new Note({
      room: roomId,
      title: title.trim(),
      content: content.trim(),
      isPublic: isPublic === 'true' || isPublic === true,
      createdBy: user._id
    });

    await newNote.save();

    req.session.success = 'Tạo note thành công!';
    res.redirect(`/room/${roomId}?tab=notes`);
  } catch (err) {
    console.error('Error creating note:', err);
    
    const room = await Room.findById(req.params.id).populate('admin members.user');
    const notes = await Note.find({ room: req.params.id })
      .populate("createdBy", "username")
      .sort({ createdAt: -1 })
      .limit(6);

    const formattedNotes = notes.map((n) => ({
      _id: n._id,
      title: n.title,
      content: n.content,
      isPublic: n.isPublic,
      createdAt: formatDate(n.createdAt),
      createdBy: n.createdBy ? n.createdBy.username : "Unknown",
    }));

    res.render('client/pages/room/room', {
      room,
      activeTab: 'notes',
      notes: formattedNotes,
      user: req.session.user,
      page: 1,
      totalPages: 1,
      search: '',
      error: 'Có lỗi xảy ra khi tạo note',
      formData: req.body,
      showCreateNoteModal: true
    });
  }
};
export const updateNote = async (req, res) => {
  try {
    const { id: roomId, noteId } = req.params;
    const { title, content, isPublic } = req.body;

    const room = await Room.findById(roomId).populate('admin members.user');
    if (!room) {
      return res.status(404).render('client/pages/404', { message: 'Room not found' });
    }

    const note = await Note.findOne({ _id: noteId, room: roomId });
    if (!note) {
      return res.status(404).render('client/pages/404', { message: 'Note not found' });
    }

    const user = req.session.user;
    const isAdmin = room.admin._id.toString() === user._id.toString();
    const isHost = room.members.some(m => m.user._id.toString() === user._id.toString() && m.role === 'host');
    const canManage = isAdmin || isHost;

    if (!canManage) {
      return res.status(403).render('client/pages/403', { message: 'Bạn không có quyền sửa note' });
    }

    // Cập nhật note
    note.title = title.trim();
    note.content = content.trim();
    note.isPublic = isPublic === 'true' || isPublic === true;

    await note.save();

    req.session.success = 'Cập nhật note thành công!';
    res.redirect(`/room/${roomId}?tab=notes`);
  } catch (err) {
    console.error('Error updating note:', err);
    req.session.error = 'Có lỗi xảy ra khi cập nhật note';
    res.redirect(`/room/${req.params.id}?tab=notes`);
  }
};

export const deleteNote = async (req, res) => {
  try {
    const { id: roomId, noteId } = req.params;

    const room = await Room.findById(roomId).populate('admin members.user');
    if (!room) {
      return res.status(404).render('client/pages/404', { message: 'Room not found' });
    }

    const note = await Note.findOne({ _id: noteId, room: roomId });
    if (!note) {
      return res.status(404).render('client/pages/404', { message: 'Note not found' });
    }

    const user = req.session.user;
    const isAdmin = room.admin._id.toString() === user._id.toString();
    const isHost = room.members.some(m => m.user._id.toString() === user._id.toString() && m.role === 'host');
    const canManage = isAdmin || isHost;

    if (!canManage) {
      return res.status(403).render('client/pages/403', { message: 'Bạn không có quyền xóa note' });
    }

    await Note.findByIdAndDelete(noteId);

    req.session.success = 'Xóa note thành công!';
    res.redirect(`/room/${roomId}?tab=notes`);
  } catch (err) {
    console.error('Error deleting note:', err);
    req.session.error = 'Có lỗi xảy ra khi xóa note';
    res.redirect(`/room/${req.params.id}?tab=notes`);
  }
};

export const viewNote = async (req, res) => {
  try {
    const { id: roomId, noteId } = req.params;

    const room = await Room.findById(roomId).populate('admin members.user');
    if (!room) {
      return res.status(404).render('client/pages/404', { message: 'Room not found' });
    }

    const note = await Note.findOne({ _id: noteId, room: roomId })
      .populate('createdBy', 'username');
    
    if (!note) {
      return res.status(404).render('client/pages/404', { message: 'Note not found' });
    }

    const user = req.session.user;
    const isAdmin = room.admin._id.toString() === user._id.toString();
    const isHost = room.members.some(m => m.user._id.toString() === user._id.toString() && m.role === 'host');
    const canManage = isAdmin || isHost;

    // Kiểm tra quyền xem note private
    if (!note.isPublic && !canManage) {
      return res.status(403).render('client/pages/403', { message: 'Bạn không có quyền xem note này' });
    }

    const formattedNote = {
      _id: note._id,
      title: note.title,
      content: note.content,
      isPublic: note.isPublic,
      createdAt: formatDate(note.createdAt),
      createdBy: note.createdBy ? note.createdBy.username : "Unknown",
    };

    res.render('client/pages/room/partials/note/view-note', {
      room,
      note: formattedNote,
      user: req.session.user,
      canManage
    });
  } catch (err) {
    console.error('Error viewing note:', err);
    res.status(500).render('client/pages/500', { message: 'Server error' });
  }
};