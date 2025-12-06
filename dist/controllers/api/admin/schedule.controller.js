import {} from "express";
import { validationResult } from "express-validator";
import mongoose from "mongoose";
import Schedule from "../../../models/ts/Schedule.js";
import Room from "../../../models/ts/Room.js";
import User from "../../../models/ts/User.js";
import logger from "../../../utils/logger.js";
import { getCache, setCache } from "../../../helpers/cache.js";
export const getSchedules = async (req, res) => {
    const { search, room, startDate, endDate, status, page = 1 } = req.query;
    const limit = 10;
    const skip = (Number(page) - 1) * limit;
    const cacheKey = `schedule:search=${search}:room=${room}:startDate=${startDate}:endDate=${endDate}:status=${status}:page=${page}`;
    try {
        const query = {};
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            logger.info(`Cache hit: ${cacheKey}`);
            return res.status(200).json({ success: true, data: cachedData, message: 'Fetched from cache' });
        }
        if (search) {
            query.title = { $regex: search, $options: "i" };
        }
        if (room) {
            query.room = room;
        }
        if (startDate || endDate) {
            query.startTime = {};
            if (startDate) {
                query.startTime.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setDate(end.getDate() + 1);
                query.startTime.$lt = end;
            }
        }
        if (status) {
            const now = new Date();
            if (status === "upcoming") {
                query.startTime = { ...query.startTime, $gt: now };
            }
            else if (status === "ongoing") {
                query.startTime = { ...query.startTime, $lte: now };
                query.endTime = { $gt: now };
            }
            else if (status === "completed") {
                query.endTime = { $exists: true, $lt: now };
            }
        }
        const totalSchedules = await Schedule.countDocuments(query);
        const totalPages = Math.ceil(totalSchedules / limit);
        const schedules = await Schedule.find(query)
            .populate("room", "name code")
            .populate("createdBy", "username")
            .populate("participants", "username")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const filteredSchedules = schedules.map(schedule => {
            const scheduleObj = schedule.toObject();
            if (scheduleObj.participants) {
                scheduleObj.participants = scheduleObj.participants.filter((user) => user !== null);
            }
            else {
                scheduleObj.participants = [];
            }
            return scheduleObj;
        });
        const responseData = {
            schedules: filteredSchedules,
            pagination: { page: Number(page), startDate, endDate, status: String(status), totalPages, totalSchedules, limit },
            filters: { search, room }
        };
        await setCache(cacheKey, responseData, 60);
        logger.info(`Cache miss : save ${cacheKey}`);
        res.status(200).json({ success: true, data: responseData, message: 'Successfully fetched schedule list' });
    }
    catch (err) {
        logger.error("Error fetching schedules list", err);
        return res.status(500).json({
            success: false,
            message: "Error fetching schedules list",
            error: err.message,
        });
    }
};
export const getScheduleById = async (req, res) => {
    try {
        const scheduleId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid schedule ID",
            });
        }
        const schedule = await Schedule.findById(scheduleId)
            .populate("room", "name code description")
            .populate("createdBy", "username email")
            .populate("participants", "username email");
        if (!schedule) {
            logger.warn(`Schedule not found: id=${scheduleId}`);
            return res.status(404).json({
                success: false,
                message: "Schedule not found",
            });
        }
        const scheduleObj = schedule.toObject();
        if (scheduleObj.participants) {
            scheduleObj.participants = scheduleObj.participants.filter((user) => user !== null);
        }
        else {
            scheduleObj.participants = [];
        }
        const now = new Date();
        let scheduleStatus = "upcoming";
        if (!schedule.startTime || isNaN(schedule.startTime.getTime())) {
            logger.warn(`Invalid startTime for schedule: id=${scheduleId}`);
            return res.status(400).json({
                success: false,
                message: "Invalid start time in schedule",
            });
        }
        if (!schedule.endTime || isNaN(schedule.endTime.getTime()) || schedule.endTime < schedule.startTime) {
            logger.warn(`Invalid or missing endTime for schedule: id=${scheduleId}`);
        }
        else {
            if (schedule.startTime > now) {
                scheduleStatus = "upcoming";
            }
            else if (schedule.startTime <= now && schedule.endTime > now) {
                scheduleStatus = "ongoing";
            }
            else {
                scheduleStatus = "completed";
            }
        }
        logger.info(`Fetched schedule: id=${scheduleId}`);
        return res.status(200).json({
            success: true,
            data: {
                schedule: scheduleObj,
                scheduleStatus,
            },
            message: "Successfully fetched schedule",
        });
    }
    catch (err) {
        logger.error("Error fetching schedule", err);
        return res.status(500).json({
            success: false,
            message: "Error fetching schedule",
            error: err.message,
        });
    }
};
export const createSchedule = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorArray = errors.array();
            const firstError = errorArray[0]?.msg || "Invalid input";
            logger.warn(`Validation error: ${firstError}`, { errors: errorArray });
            return res.status(400).json({
                success: false,
                message: "Invalid input data",
                error: firstError,
            });
        }
        if (!req.admin || !req.admin._id) {
            logger.warn("Unauthorized: Session expired");
            return res.status(401).json({
                success: false,
                message: "Session expired",
            });
        }
        const { title, description, room, participants, startTime, endTime } = req.body;
        const roomExists = await Room.findById(room);
        if (!roomExists) {
            return res.status(400).json({
                success: false,
                message: "Room not found",
            });
        }
        let processedParticipants = [];
        if (participants && Array.isArray(participants)) {
            const userIds = participants.filter(Boolean);
            const validUsers = await User.find({ _id: { $in: userIds }, role: "user" }).lean("_id");
            const validUserIds = validUsers.map((user) => user._id.toString());
            processedParticipants = userIds.filter((userId) => validUserIds.includes(userId));
        }
        const startTimeDate = new Date(startTime);
        const endTimeDate = endTime ? new Date(endTime) : undefined;
        if (isNaN(startTimeDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid start time",
            });
        }
        if (endTime && (isNaN(endTimeDate.getTime()) || endTimeDate < startTimeDate)) {
            return res.status(400).json({
                success: false,
                message: "Invalid end time or end time must be after start time",
            });
        }
        const newSchedule = new Schedule({
            title: title.trim(),
            description: description ? description.trim() : undefined,
            room,
            participants: processedParticipants,
            createdBy: req.admin._id,
            startTime: startTimeDate,
            endTime: endTimeDate,
        });
        await newSchedule.save();
        const populatedSchedule = await Schedule.findById(newSchedule._id)
            .populate("room", "name code")
            .populate("createdBy", "username")
            .populate("participants", "username");
        logger.info(`Created schedule: title=${title}, id=${newSchedule._id}`);
        return res.status(201).json({
            success: true,
            data: populatedSchedule,
            message: "Successfully created schedule",
        });
    }
    catch (err) {
        logger.error("Error creating schedule", err);
        return res.status(500).json({
            success: false,
            message: "Error creating schedule",
            error: err.message,
        });
    }
};
export const updateSchedule = async (req, res) => {
    try {
        const scheduleId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid schedule ID",
            });
        }
        const schedule = await Schedule.findById(scheduleId);
        if (!schedule) {
            logger.warn(`Schedule not found: id=${scheduleId}`);
            return res.status(404).json({
                success: false,
                message: "Schedule not found",
            });
        }
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorArray = errors.array();
            const firstError = errorArray[0]?.msg || "Invalid input";
            logger.warn(`Validation error: ${firstError}`);
            return res.status(400).json({
                success: false,
                message: "Invalid input data",
                error: firstError,
            });
        }
        const { title, description, room, participants, startTime, endTime } = req.body;
        if (room) {
            const roomExists = await Room.findById(room);
            if (!roomExists) {
                return res.status(400).json({
                    success: false,
                    message: "Room not found",
                });
            }
        }
        let processedParticipants = [];
        if (participants && Array.isArray(participants)) {
            const userIds = participants.filter(Boolean);
            const validUsers = await User.find({ _id: { $in: userIds }, role: "user" }).lean("_id");
            const validUserIds = validUsers.map((user) => user._id.toString());
            processedParticipants = userIds.filter((userId) => validUserIds.includes(userId));
        }
        const startTimeDate = new Date(startTime);
        const endTimeDate = endTime ? new Date(endTime) : undefined;
        if (isNaN(startTimeDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid start time",
            });
        }
        if (endTime && (isNaN(endTimeDate.getTime()) || endTimeDate < startTimeDate)) {
            return res.status(400).json({
                success: false,
                message: "Invalid end time or end time must be after start time",
            });
        }
        const updatedSchedule = await Schedule.findByIdAndUpdate(scheduleId, {
            title: title.trim(),
            description: description ? description.trim() : undefined,
            room,
            participants: processedParticipants,
            startTime: startTimeDate,
            endTime: endTimeDate,
            updatedAt: new Date(),
        }, { new: true, runValidators: true })
            .populate("room", "name code")
            .populate("createdBy", "username")
            .populate("participants", "username");
        logger.info(`Updated schedule: id=${scheduleId}, title=${title}`);
        return res.status(200).json({
            success: true,
            data: updatedSchedule,
            message: "Successfully updated schedule",
        });
    }
    catch (err) {
        logger.error("Error updating schedule", err);
        return res.status(500).json({
            success: false,
            message: "Error updating schedule",
            error: err.message,
        });
    }
};
export const updateSchedulePartial = async (req, res) => {
    try {
        const scheduleId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid schedule ID",
            });
        }
        const schedule = await Schedule.findById(scheduleId);
        if (!schedule) {
            logger.warn(`Schedule not found: id=${scheduleId}`);
            return res.status(404).json({
                success: false,
                message: "Schedule not found",
            });
        }
        const updates = { ...req.body };
        if (updates.room) {
            const roomExists = await Room.findById(updates.room);
            if (!roomExists) {
                return res.status(400).json({
                    success: false,
                    message: "Room not found",
                });
            }
        }
        if (updates.participants && Array.isArray(updates.participants)) {
            const userIds = updates.participants.filter(Boolean);
            const validUsers = await User.find({ _id: { $in: userIds }, role: "user" }).lean("_id");
            const validUserIds = validUsers.map((user) => user._id.toString());
            updates.participants = userIds.filter((userId) => validUserIds.includes(userId));
        }
        if (updates.title) {
            updates.title = updates.title.trim();
        }
        if (updates.description) {
            updates.description = updates.description.trim();
        }
        if (updates.startTime) {
            const startTimeDate = new Date(updates.startTime);
            if (isNaN(startTimeDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid start time",
                });
            }
            updates.startTime = startTimeDate;
        }
        if (updates.endTime) {
            const endTimeDate = new Date(updates.endTime);
            if (isNaN(endTimeDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid end time",
                });
            }
            updates.endTime = endTimeDate;
        }
        // Kiểm tra tính hợp lệ của startTime và endTime
        if (updates.startTime && updates.endTime) {
            if (updates.endTime < updates.startTime) {
                return res.status(400).json({
                    success: false,
                    message: "End time must be after start time",
                });
            }
        }
        if (updates.startTime && schedule.endTime) {
            if (updates.startTime > schedule.endTime) {
                return res.status(400).json({
                    success: false,
                    message: "Start time cannot be after existing end time",
                });
            }
        }
        if (updates.endTime && schedule.startTime) {
            if (updates.endTime < schedule.startTime) {
                return res.status(400).json({
                    success: false,
                    message: "End time cannot be before existing start time",
                });
            }
        }
        updates.updatedAt = new Date();
        const updatedSchedule = await Schedule.findByIdAndUpdate(scheduleId, { $set: updates }, { new: true, runValidators: true })
            .populate("room", "name code")
            .populate("createdBy", "username")
            .populate("participants", "username");
        logger.info(`Patched schedule: id=${scheduleId}`);
        return res.status(200).json({
            success: true,
            data: updatedSchedule,
            message: "Successfully patched schedule",
        });
    }
    catch (err) {
        logger.error("Error patching schedule", err);
        return res.status(500).json({
            success: false,
            message: "Error patching schedule",
            error: err.message,
        });
    }
};
export const deleteSchedule = async (req, res) => {
    try {
        const scheduleId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid schedule ID",
            });
        }
        const schedule = await Schedule.findById(scheduleId);
        if (!schedule) {
            logger.warn(`Schedule not found: id=${scheduleId}`);
            return res.status(404).json({
                success: false,
                message: "Schedule not found",
            });
        }
        await Schedule.deleteOne({ _id: scheduleId });
        logger.info(`Deleted schedule: id=${scheduleId}`);
        return res.status(200).json({
            success: true,
            message: "Successfully deleted schedule",
        });
    }
    catch (err) {
        logger.error("Error deleting schedule", err);
        return res.status(500).json({
            success: false,
            message: "Error deleting schedule",
            error: err.message,
        });
    }
};
export const getSchedulesByRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { status, page = 1 } = req.query;
        const limit = 10;
        const skip = (Number(page) - 1) * limit;
        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid room ID",
            });
        }
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found",
            });
        }
        const query = { room: roomId };
        if (status) {
            const now = new Date();
            if (status === "upcoming") {
                query.startTime = { $gt: now };
            }
            else if (status === "ongoing") {
                query.startTime = { $lte: now };
                query.endTime = { $exists: true, $gt: now };
            }
            else if (status === "completed") {
                query.endTime = { $exists: true, $lt: now };
            }
        }
        const totalSchedules = await Schedule.countDocuments(query);
        const totalPages = Math.ceil(totalSchedules / limit);
        const schedules = await Schedule.find(query)
            .populate("createdBy", "username")
            .populate("participants", "username")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const filteredSchedules = schedules.map(schedule => {
            const scheduleObj = schedule.toObject();
            if (scheduleObj.participants) {
                scheduleObj.participants = scheduleObj.participants.filter((user) => user !== null);
            }
            else {
                scheduleObj.participants = [];
            }
            return scheduleObj;
        });
        logger.info(`Fetched schedules for room: roomId=${roomId}, page=${page}`);
        return res.status(200).json({
            success: true,
            data: {
                schedules: filteredSchedules,
                room,
                pagination: {
                    page: Number(page),
                    totalPages,
                    totalSchedules,
                    limit,
                },
            },
            message: "Successfully fetched schedules for room",
        });
    }
    catch (err) {
        logger.error("Error fetching schedules by room", err);
        return res.status(500).json({
            success: false,
            message: "Error fetching schedules by room",
            error: err.message,
        });
    }
};
//# sourceMappingURL=schedule.controller.js.map