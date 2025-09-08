import { type Request, type Response } from "express";
import Room from "../../../models/ts/Room.js";
import Message from "../../../models/ts/Message.js";
import mongoose from "mongoose";
import logger from "../../../utils/logger.js";

interface MessageDocument extends mongoose.Document {
  content: string;
  room: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  createdAt: Date;
}

interface GetMessagesQuery {
  search?: string;
  room?: string;
  page?: string | number;
}

export const getMessages = async (req: Request<{}, {}, {}, GetMessagesQuery>, res: Response) => {
  const { search, room, page = 1 } = req.query;
  const limit = 10;
  const skip = (Number(page) - 1) * limit;

  try {
    const query: Record<string, any> = {};
    if (search) query.content = { $regex: search, $options: "i" };
    if (room) query.room = room;

    const totalMessages = await Message.countDocuments(query);
    const totalPages = Math.ceil(totalMessages / limit);

    const messages = await Message.find(query)
      .populate("room", "name")
      .populate("sender", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const rooms = await Room.find().select("name");

    logger.info(`Fetched messages: page=${page}, total=${totalMessages}`);
    return res.status(200).json({
      success: true,
      data: {
        messages,
        rooms,
        pagination: {
          page: Number(page),
          totalPages,
          totalMessages,
          limit,
        },
        filters: {
          search: search || "",
          room: room || "",
        },
      },
      message: "Successfully fetched messages list",
    });
  } catch (err: any) {
    logger.error("Error fetching messages list", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching messages list",
      error: err.message,
    });
  }
};

export const getMessageById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const messageId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID",
      });
    }

    const message = await Message.findById(messageId)
      .populate("room", "name")
      .populate("sender", "username") as MessageDocument | null;

    if (!message) {
      logger.warn(`Message not found: id=${messageId}`);
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    logger.info(`Fetched message: id=${messageId}`);
    return res.status(200).json({
      success: true,
      data: { message },
      message: "Successfully fetched message",
    });
  } catch (err: any) {
    logger.error("Error fetching message", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching message",
      error: err.message,
    });
  }
};

export const deleteMessage = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const messageId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID",
      });
    }

    const message = await Message.findById(messageId) as MessageDocument | null;

    if (!message) {
      logger.warn(`Message not found: id=${messageId}`);
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    await Message.deleteOne({ _id: messageId });
    logger.info(`Deleted message: id=${messageId}`);
    return res.status(200).json({
      success: true,
      message: "Successfully deleted message",
    });
  } catch (err: any) {
    logger.error("Error deleting message", err);
    return res.status(500).json({
      success: false,
      message: "Error deleting message",
      error: err.message,
    });
  }
};