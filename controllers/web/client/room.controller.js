import Room from "../../../models/Room.js";
import File from "../../../models/File.js";
import Task from "../../../models/Task.js";
import Schedule from "../../../models/Schedule.js";
import Note from "../../../models/Note.js";
import Message from "../../../models/Message.js";
import { validationResult } from "express-validator";
import { v4 as uuidv4 } from "uuid";


export const showRoom = async (req, res) => {
  try {
    const roomId = req.params.id;
    const userId = req.session.user?._id;

    if (!userId) {
      return res.redirect("/login");
    }

    const room = await Room.findById(roomId)
      .populate("admin", "username email")
      .populate("members.user", "username email");

    if (!room) {
      req.session.error = "Phòng không tồn tại!";
      return res.redirect("/home");
    }

    const isMember = room.members.some(
      (m) => m.user._id.toString() === userId.toString()
    );

    if (!isMember) {
      req.session.error = "Path error";
      return res.redirect("/home");
    }

    const messages = await Message.find({ room: roomId })
      .populate("sender")
      .sort({ createdAt: 1 });

    res.render("client/pages/room/room", {
      room,
      user: req.session.user,
      messages,
      activeTab: "chat"
    });
  } catch (error) {
    console.error("Something wrong in showRoom", error);
    req.session.error = "Lỗi hệ thống!";
    return res.redirect("/home");
  }
};

export const showCreateRoom = (req, res) => {
    res.render("client/pages/room/create-room",{
      errors: [],
      oldInput: {},
      error: null,
      success: null
    });
}

export const createRoomClient = async(req, res) => {
  try {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      return res.status(400).render("client/pages/room/create-room",{
        errors: errors.array(),
        oldInput: req.body,
        error: null,
        success: null
      });
    }

    const {name, description} = req.body;
    const userId = req.session.user._id;

    let roomCode = uuidv4().slice(0,8);
    let codeExists = await Room.findOne({ code: roomCode});
    let attempts = 0;
    const maxAttempts = 10;

    while(codeExists && attempts < maxAttempts){
      roomCode = uuidv4().slice(0,8);
      codeExists = await Room.findOne({ code: roomCode});
      attempts ++ ;
    }

    if(codeExists){
      return res.status(400).render("client/pages/room/create-room",{
        errors: [],
        oldInput: req.body,
        error: 'Không thể tạo mã phòng duy nhất , vui lòng thử lại',
        success: null
      });
    }

    const newRoom = new Room({
      name,
      description,
      code: roomCode,
      admin: userId,
      members: [{ user: userId, role: "host"}]
    });

    await newRoom.save();
    res.redirect(`/room/${newRoom._id}`);
  } catch (error) {
    console.error('Error creating room: ', error);
    res.status(500).render("client/pages/room/create-room",{
      error: "Server error",
      errors: [],
      oldInput: req.body,
      success: null
    });
  }
}

export const leaveOrEndRoom = async(req, res) => {
  try {
    const roomId = req.params.id;
    const userId = req.session.user._id;
    const room = await Room.findById(roomId);
    if(!room){
      return res.redirect("/room?error=Room not found");
    }

    if(room.admin.toString() === userId.toString()){
      await Message.deleteMany({ room: roomId});
      await File.deleteMany({room: roomId});
      await Note.deleteMany({room: roomId});
      await Task.deleteMany({room: roomId});
      await Schedule.deleteMany({room: roomId});
      await Room.findByIdAndDelete(roomId);
      req.session.success = "You have finished the room!";
      return res.redirect('/home');
    }

    room.members = room.members.filter((m) => m.user.toString() !== userId.toString());

    await room.save();
    req.session.success = "You have left the room !";
    return res.redirect('/home');
  } catch (error) {
    console.error('Exit room error', error);
    return res.redirect("/room?error=Server error");
  }
}

export const joinRoomByCode = async(req, res) => {
  try {
    const { code } = req.body;
    const userId = req.session.user?._id;
    const room = await Room.findOne({ code });
    if(!room){
      req.session.error = " Mã phòng không tồn tại ";
      res.redirect("/home");
    }

    const isMember = room.members.some(m => m.user.toString() === userId.toString());
    if(isMember){
      req.session.success = "Bạn đã có trong phòng này ";
      return res.redirect(`/room/${room._id}`);
    }
    room.members.push({ user: userId, role: "member"});
    await room.save();
    req.session.success = "Tham gia phòng thành công";
    return res.redirect(`/room/${room._id}`);
  } catch (error) {
    console.error("Join room error", error);
    req.session.error = "Có lỗi khi tham gia phòng";
    return res.redirect('/home');
  }
}

  export const showRoomMembers = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const room = await Room.findById(roomId).populate("members.username"); 

    if (!room) {
      return res.redirect("home/?error=Phòng không tồn tại");
    }

    res.render("client/pages/room/room", {
      members: room.members.map(m => ({
        name: m.user.name,
        email: m.user.email,
        role: m.role
      })),
      activeTab: "members", 
    });
  } catch (error) {
    console.error(error);
    res.redirect("/room?error=Không thể tải danh sách thành viên");
  }
}
