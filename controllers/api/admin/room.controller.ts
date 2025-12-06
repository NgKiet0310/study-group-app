import { type Request, type Response } from "express";
import { validationResult, type ValidationError } from "express-validator";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import Room from "../../../models/ts/Room.js";
import User from "../../../models/ts/User.js";
import logger from "../../../utils/logger.js";
// import { getCache, setCache } from "../../../helpers/cache.js";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    username: string;
    role: string;
  };
}

interface GetRoomsQuery {
  search?: string;
  memberCount?: string;
  startDate?: string;
  endDate?: string;
  page?: string | number;
}

interface MemberData {
  user: string;
  role: "host" | "member";
}

interface RoomBody {
  name: string;
  code?: string;
  description?: string;
  members?: MemberData[];
}

// export const getRooms = async (req: Request<{}, {}, {}, GetRoomsQuery>, res: Response) => {
//   const { search, memberCount, startDate, endDate, page = 1 } = req.query;
//   const limit = 5;
//   const skip = (Number(page) - 1) * limit;
//   const cacheKey = `room:search"=${search}:memberCount=${memberCount}:startDate=${startDate}:endDate=${endDate}:page=${page}`;
//   try {
//     const cachedData = await getCache(cacheKey);
//     if(cachedData){
//       logger.info(`Cache hit ${cacheKey}`);
//       res.status(200).json({ success: true, data: cachedData, message: 'Fetched from cache' })
//     }
//     const query: Record<string, any> = {};
//     if (search) {
//       query.$or = [
//         { name: { $regex: search, $options: "i" } },
//         { code: { $regex: search, $options: "i" } },
//       ];
//     }

//     if (memberCount) {
//       if (memberCount === "0-5") {
//         query.$expr = { 
//           $and: [
//             { $gte: [{ $size: "$members" }, 0] }, 
//             { $lte: [{ $size: "$members" }, 5] }
//           ] 
//         };
//       } else if (memberCount === "6-10") {
//         query.$expr = { 
//           $and: [
//             { $gte: [{ $size: "$members" }, 6] }, 
//             { $lte: [{ $size: "$members" }, 10] }
//           ] 
//         };
//       } else if (memberCount === ">10") {
//         query.$expr = { $gt: [{ $size: "$members" }, 10] };
//       }
//     }

//     if (startDate || endDate) {
//       query.createdAt = {};
//       if (startDate) {
//         query.createdAt.$gte = new Date(startDate);
//       }
//       if (endDate) {
//         query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
//       }
//     }

//     const totalRooms = await Room.countDocuments(query);
//     const totalPages = Math.ceil(totalRooms / limit);

//     const rooms = await Room.find(query)
//       .populate({
//         path: "members.user",
//         select: "username",
//       })
//       .populate("admin", "username")
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);

//     rooms.forEach((room) => {
//       room.members = room.members.filter((member) => member.user !== null);
//     });

//     const responseData = {
//       rooms, 
//       panigation: {page: Number(page), totalRooms, totalPages, limit},
//       filters: {search, memberCount: Number(memberCount), startDate, endDate}
//     };

//     await setCache(cacheKey, responseData, 60);
//     logger.info(`Cache miss: saved ${cacheKey}`);
//     res.status(200).json({success: true, data: responseData, message: 'Successfully fetched room list'});
//   } catch (err: any) {
//     logger.error("Error fetching rooms list", err);
//     return res.status(500).json({ 
//       success: false,
//       message: "Error fetching rooms list",
//       error: err.message,
//     });
//   }
// };

export const createRoom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorArray: ValidationError[] = errors.array();
      const firstError = errorArray[0]?.msg || "Invalid input";

      logger.warn(`Validation error: ${firstError}`, { errors: errorArray });
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        error: firstError,
      });
    }

    const { name, code, description, members } = req.body;

    const existingRoom = await Room.findOne({ name });
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: "Room name already exists",
      });
    }

    let roomCode = code || uuidv4().slice(0, 8);
    let codeExists = await Room.findOne({ code: roomCode });
    let attempts = 0;
    const maxAttempts = 10;

    while (codeExists && attempts < maxAttempts) {
      roomCode = uuidv4().slice(0, 8);
      codeExists = await Room.findOne({ code: roomCode });
      attempts++;
    }

    if (codeExists) {
      return res.status(400).json({
        success: false,
        message: "Cannot generate unique room code, please try again",
      });
    }

    let processedMembers: MemberData[] = [];
    if (members && Array.isArray(members)) {
      const hostCount = members.filter((member) => member.role === "host").length;
      if (hostCount > 1) {
        return res.status(400).json({
          success: false,
          message: "Only one member can have host role",
        });
      }

      const userIds = members.map((member) => member.user).filter(Boolean);
      
      const validUsers = await User.find({ 
        _id: { $in: userIds }, 
        role: "user" 
      }).lean("_id username");
       const validUserIds = validUsers.map((user) => user._id.toString());
     

      processedMembers = members
        .filter((member) => member.user && validUserIds.includes(member.user))
        .map((member) => ({
          user: member.user,
          role: member.role || "member",
        }));

      processedMembers = [
        ...new Map(processedMembers.map((item) => [item.user, item])).values(),
      ];
    }

    const adminId = req.user.id;
    console.log("req.user:", req.user);

    const adminExists = await User.findById(adminId);
    if (!adminExists) {
      return res.status(400).json({
        success: false,
        message: "Admin user not found",
      });
    }

    const newRoom = new Room({
      name,
      code: roomCode,
      description: description || "",
      admin: adminId,
      members: processedMembers,
      createdAt: new Date(),
    });

    await newRoom.save();
    logger.info(`Created room: name=${name}, code=${roomCode}, admin=${adminId}`);

    return res.status(201).json({
      success: true,
      data: newRoom,
      message: "Successfully created room",
    });
  } catch (err: any) {
    logger.error("Error creating room", err);
    return res.status(500).json({
      success: false,
      message: "Error creating room",
      error: err.message,
    });
  }
};

export const getRoomById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const roomId = req.params.id;

    const room = await Room.findById(roomId)
      .populate("admin", "username")
      .populate("members.user", "username");

    if (!room) {
      logger.warn(`Room not found: id=${roomId}`);
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    room.members = room.members.filter((member) => member.user);

    logger.info(`Fetched room: id=${roomId}`);
    return res.status(200).json({
      success: true,
      data: room,
      message: "Successfully fetched room",
    });
  } catch (err: any) {
    logger.error("Error fetching room", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching room",
      error: err.message,
    });
  }
};

export const updateRoom = async (req: Request<{ id: string }, {}, RoomBody>, res: Response) => {
  try {
    const roomId = req.params.id;

    const room = await Room.findById(roomId);
    if (!room) {
      logger.warn(`Room not found: id=${roomId}`);
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorArray: ValidationError[] = errors.array();
      const firstError = errorArray[0]?.msg || "Invalid input";

      logger.warn(`Validation error: ${firstError}`);
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        error: firstError,
      });
    }

    const { name, code, description, members } = req.body;

    const existingRoom = await Room.findOne({ name, _id: { $ne: roomId } });
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: "Room name already exists",
      });
    }

    let roomCode = code || room.code;
    const codeExists = await Room.findOne({ code: roomCode, _id: { $ne: roomId } });
    if (codeExists) {
      return res.status(400).json({
        success: false,
        message: "Room code already exists",
      });
    }

    let processedMembers: MemberData[] = [];
    if (members && Array.isArray(members)) {
      const hostCount = members.filter((member) => member.role === "host").length;
      if (hostCount > 1) {
        return res.status(400).json({
          success: false,
          message: "Only one member can have host role",
        });
      }

      const userIds = members.map((member) => member.user).filter(Boolean);
      const validUsers = await User.find({ 
        _id: { $in: userIds }, 
        role: "user" 
      }).lean("_id username");
      const validUserIds = validUsers.map((user) => user._id.toString());

      processedMembers = members
        .filter((member) => member.user && validUserIds.includes(member.user))
        .map((member) => ({
          user: member.user,
          role: member.role || "member",
        }));

      processedMembers = [
        ...new Map(processedMembers.map((item) => [item.user, item])).values(),
      ];
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      {
        name,
        code: roomCode,
        description: description || "",
        members: processedMembers,
      },
      { new: true, runValidators: true }
    )
      .populate("admin", "username")
      .populate("members.user", "username");

    logger.info(`Updated room: id=${roomId}, name=${name}`);

    return res.status(200).json({
      success: true,
      data: updatedRoom,
      message: "Successfully updated room",
    });
  } catch (err: any) {
    logger.error("Error updating room", err);
    return res.status(500).json({
      success: false,
      message: "Error updating room",
      error: err.message,
    });
  }
};

export const updateRoomPartial = async (
  req: Request<{ id: string }, {}, Partial<RoomBody>>,
  res: Response
) => {
  try {
    const roomId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid room ID",
      });
    }

    const updates: Partial<RoomBody> = { ...req.body };

    if (updates.members && Array.isArray(updates.members)) {
      const hostCount = updates.members.filter((member) => member.role === "host").length;
      if (hostCount > 1) {
        return res.status(400).json({
          success: false,
          message: "Only one member can have host role",
        });
      }

      const userIds = updates.members.map((member) => member.user).filter(Boolean);
      const validUsers = await User.find({ 
        _id: { $in: userIds }, 
        role: "user" 
      }).lean("_id username");
      const validUserIds = validUsers.map((user) => user._id.toString());

      const processedMembers = updates.members
        .filter((member) => member.user && validUserIds.includes(member.user))
        .map((member) => ({
          user: member.user,
          role: member.role || "member",
        }));

      updates.members = [
        ...new Map(processedMembers.map((item) => [item.user, item])).values(),
      ];
    }

    const room = await Room.findByIdAndUpdate(
      roomId,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate("admin", "username")
      .populate("members.user", "username");

    if (!room) {
      logger.warn(`Room not found (PATCH): id=${roomId}`);
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    logger.info(`Patched room: id=${roomId}`);
    return res.status(200).json({
      success: true,
      data: room,
      message: "Successfully patched room",
    });
  } catch (err: any) {
    logger.error("Error patching room", err);
    return res.status(500).json({
      success: false,
      message: "Error patching room",
      error: err.message,
    });
  }
};

export const deleteRoom = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const roomId = req.params.id;

    const room = await Room.findById(roomId);
    if (!room) {
      logger.warn(`Room not found: id=${roomId}`);
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    await Room.deleteOne({ _id: roomId });
    logger.info(`Deleted room: id=${roomId}`);

    return res.status(200).json({
      success: true,
      message: "Successfully deleted room",
    });
  } catch (err: any) {
    logger.error("Error deleting room", err);
    return res.status(500).json({
      success: false,
      message: "Error deleting room",
      error: err.message,
    });
  }
};