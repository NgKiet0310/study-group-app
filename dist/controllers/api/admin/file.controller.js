import {} from "express";
import File from "../../../models/ts/File.js";
import Room from "../../../models/ts/Room.js";
import mongoose from "mongoose";
import logger from "../../../utils/logger.js";
import { getCache, cacheWrapper, setCache, deleteCacheByPrefix, deleteCache } from "../../../helpers/cache.js";
export const getFiles = async (req, res) => {
    const { search, room, fileType, page = 1 } = req.query;
    const limit = 10;
    const skip = (Number(page) - 1) * limit;
    const cacheKey = `files:search=${search || ''}:room=${room || ''}:fileType=${fileType || ''}:page=${page}`;
    try {
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            logger.info(`Cache hit: ${cacheKey}`);
            return res.status(200).json({ success: true, data: cachedData, message: 'Fetched from cache' });
        }
        const query = {};
        if (search)
            query.fileName = { $regex: search, $options: "i" };
        if (room)
            query.room = room;
        if (fileType)
            query.fileType = fileType;
        const totalFiles = await File.countDocuments(query);
        const totalPages = Math.ceil(totalFiles / limit);
        const files = await File.find(query)
            .populate("room", "name")
            .populate("uploadedBy", "username")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const rooms = await Room.find().select("name");
        const fileTypes = ["pdf", "image", "doc", "other"];
        const responseData = {
            files,
            rooms,
            fileTypes,
            pagination: { page: Number(page), totalPages, totalFiles, limit },
            filters: { search, room, fileType }
        };
        await setCache(cacheKey, responseData, 60);
        logger.info(`Cache miss: saved ${cacheKey}`);
        return res.status(200).json({
            success: true,
            data: responseData,
            message: 'Successfully fetched files list'
        });
    }
    catch (err) {
        logger.error("Error fetching files list", err);
        return res.status(500).json({
            success: false,
            message: "Error fetching files list",
            error: err.message,
        });
    }
};
export const getFileById = async (req, res) => {
    const fileId = req.params.id;
    const cacheKey = `file:id=${fileId}`;
    try {
        if (!mongoose.Types.ObjectId.isValid(fileId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid file ID",
            });
        }
        const file = await cacheWrapper(cacheKey, async () => {
            return await File.findById(fileId)
                .populate("room", "name")
                .populate("uploadedBy", "username");
        }, 60);
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
    }
    catch (err) {
        logger.error("Error fetching file", err);
        return res.status(500).json({
            success: false,
            message: "Error fetching file",
            error: err.message,
        });
    }
};
export const deleteFile = async (req, res) => {
    const fileId = req.params.id;
    try {
        if (!mongoose.Types.ObjectId.isValid(fileId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid file ID",
            });
        }
        const file = await File.findById(fileId);
        if (!file) {
            logger.warn(`File not found: id=${fileId}`);
            return res.status(404).json({
                success: false,
                message: "File not found",
            });
        }
        await File.deleteOne({ _id: fileId });
        await deleteCacheByPrefix("files");
        await deleteCache(`file:id=${fileId}`);
        return res.status(200).json({
            success: true,
            message: "Successfully deleted file",
        });
    }
    catch (err) {
        logger.error("Error deleting file", err);
        return res.status(500).json({
            success: false,
            message: "Error deleting file",
            error: err.message,
        });
    }
};
//# sourceMappingURL=file.controller.js.map