import { type Request, type Response } from "express";
import File from "../../../models/ts/File.js";
import Room from "../../../models/ts/Room.js";
import mongoose from "mongoose";
import logger from "../../../utils/logger.js";

interface FileDocument extends mongoose.Document {
  fileName: string;
  fileType: string;
  room: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

interface GetFilesQuery {
  search?: string;
  room?: string;
  fileType?: string;
  page?: string | number;
}

export const getFiles = async (req: Request<{}, {}, {}, GetFilesQuery>, res: Response) => {
  const { search, room, fileType, page = 1 } = req.query;
  const limit = 10;
  const skip = (Number(page) - 1) * limit;

  try {
    const query: Record<string, any> = {};
    if (search) query.fileName = { $regex: search, $options: "i" };
    if (room) query.room = room;
    if (fileType) query.fileType = fileType;

    const totalFiles = await File.countDocuments(query);
    const files = await File.find(query)
      .populate("room", "name")
      .populate("uploadedBy", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const rooms = await Room.find().select("name");
    const fileTypes = ["pdf", "image", "doc", "other"];

    logger.info(`Fetched files: page=${page}, total=${totalFiles}`);
    return res.status(200).json({
      success: true,
      data: {
        files,
        rooms,
        fileTypes,
        pagination: {
          page: Number(page),
          totalPages: Math.ceil(totalFiles / limit),
          totalFiles,
          limit,
        },
        filters: {
          search: search || "",
          room: room || "",
          fileType: fileType || "",
        },
      },
      message: "Successfully fetched files list",
    });
  } catch (err: any) {
    logger.error("Error fetching files list", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching files list",
      error: err.message,
    });
  }
};

export const getFileById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const fileId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file ID",
      });
    }

    const file = await File.findById(fileId)
      .populate("room", "name")
      .populate("uploadedBy", "username") as FileDocument | null;

    if (!file) {
      logger.warn(`File not found: id=${fileId}`);
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    logger.info(`Fetched file: id=${fileId}`);
    return res.status(200).json({
      success: true,
      data: { file },
      message: "Successfully fetched file",
    });
  } catch (err: any) {
    logger.error("Error fetching file", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching file",
      error: err.message,
    });
  }
};

export const deleteFile = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const fileId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file ID",
      });
    }

    const file = await File.findById(fileId) as FileDocument | null;

    if (!file) {
      logger.warn(`File not found: id=${fileId}`);
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    await File.deleteOne({ _id: fileId });
    logger.info(`Deleted file: id=${fileId}`);
    return res.status(200).json({
      success: true,
      message: "Successfully deleted file",
    });
  } catch (err: any) {
    logger.error("Error deleting file", err);
    return res.status(500).json({
      success: false,
      message: "Error deleting file",
      error: err.message,
    });
  }
};