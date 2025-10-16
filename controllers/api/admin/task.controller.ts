import { type Request, type Response } from "express";
import { validationResult, type ValidationError } from "express-validator";
import mongoose from "mongoose";
import Task from "../../../models/ts/Task.js";
import Room from "../../../models/ts/Room.js";
import User from "../../../models/ts/User.js";
import logger from "../../../utils/logger.js";
import { getCache, setCache } from "../../../helpers/cache.js";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    username: string;
    role: string;
  };
}
    
interface GetTasksQuery {
  search?: string;
  room?: string;
  status?: "pending" | "in-progress" | "completed";
  assignedTo?: string;
  dueDate?: string;
  createdBy?: string;
  page?: string | number;
}

interface TaskBody {
  title: string;
  description?: string;
  room: string;
  assignedTo?: string[];
  createdBy: string;
  status?: "pending" | "in-progress" | "completed";
  dueDate?: string;
}

export const getTasks = async (req: Request<{}, {}, {}, GetTasksQuery>, res: Response) => {
  const { search, room, status, assignedTo, dueDate, createdBy, page = 1 } = req.query;
  const limit = 5;
  const skip = (Number(page) - 1) * limit;
  const cacheKey = `task:search=${search}:room=${room}:status=${status}:assignedTo=${assignedTo}:dueDate=${dueDate}:createdBy=${createdBy}:page=${page}`;
  try {
    const query: Record<string, any> = {};
    const cachedData = await getCache(cacheKey);
    if(cachedData){
      logger.info(`Cache hit: ${cacheKey}`);
      return res.status(200).json({ success: true, data: cachedData, message: 'Fetched from cache'});
    }
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    if (room) {
      query.room = room;
    }

    if (status) {
      query.status = status;
    }

    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    if (createdBy) {
      query.createdBy = createdBy;
    }

    if (dueDate) {
      const startOfDay = new Date(dueDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dueDate);
      endOfDay.setHours(23, 59, 59, 999);
      query.dueDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const totalTasks = await Task.countDocuments(query);
    const totalPages = Math.ceil(totalTasks / limit);

    const tasks = await Task.find(query)
      .populate("room", "name")
      .populate("createdBy", "username")
      .populate("assignedTo", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const filteredTasks = tasks.map(task => {
      const taskObj = task.toObject();
      
      if (taskObj.assignedTo) {
        taskObj.assignedTo = taskObj.assignedTo.filter((user: any) => user !== null);
      } else {
        taskObj.assignedTo = [];
      }

      return taskObj;
    });

    const responseData = {
      tasks: filteredTasks,
      pagination: {page: Number(page), status: String(status), assignedTo, dueDate, createdBy, totalTasks, totalPages, limit},
      filters: {search, room }  
    };
    await setCache(cacheKey, responseData , 60);
    logger.info(`Cache miss: saved ${cacheKey}`);
    res.status(200).json({success: true, data: responseData, message: 'Successfully fetched task list'});
  } catch (err: any) {
    logger.error("Error fetching tasks list", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching tasks list",
      error: err.message,
    });
  }
};

export const createTask = async (req: AuthenticatedRequest, res: Response) => {
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

    const { title, description, room, assignedTo, createdBy, status, dueDate } = req.body;

    const roomExists = await Room.findById(room);
    if (!roomExists) {
      return res.status(400).json({
        success: false,
        message: "Room not found",
      });
    }
    const creatorExists = await User.findById(createdBy);
    if (!creatorExists) {
      return res.status(400).json({
        success: false,
        message: "Creator user not found",
      });
    }

    // Process assignedTo array and validate users
    let processedAssignedTo: string[] = [];
    if (assignedTo && Array.isArray(assignedTo)) {
      const userIds = assignedTo.filter(Boolean);
      const validUsers = await User.find({ 
        _id: { $in: userIds }, 
        role: "user" 
      }).lean("_id");
      
      const validUserIds = validUsers.map((user) => user._id.toString());
      processedAssignedTo = userIds.filter((userId) => validUserIds.includes(userId));
    }

    const newTask = new Task({
      title: title.trim(),
      description: description ? description.trim() : undefined,
      room,
      assignedTo: processedAssignedTo,
      createdBy,
      status: status || "pending",
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });

    await newTask.save();
    
    // Populate the saved task before returning
    const populatedTask = await Task.findById(newTask._id)
      .populate("room", "name")
      .populate("createdBy", "username")
      .populate("assignedTo", "username");

    logger.info(`Created task: title=${title}, id=${newTask._id}`);

    return res.status(201).json({
      success: true,
      data: populatedTask,
      message: "Successfully created task",
    });
  } catch (err: any) {
    logger.error("Error creating task", err);
    return res.status(500).json({
      success: false,
      message: "Error creating task",
      error: err.message,
    });
  }
};

export const getTaskById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const taskId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const task = await Task.findById(taskId)
      .populate("room", "name description")
      .populate("createdBy", "username email role")
      .populate("assignedTo", "username email role");

    if (!task) {
      logger.warn(`Task not found: id=${taskId}`);
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Convert to object and filter null values to avoid prototype issues
    const taskObj = task.toObject();
    if (taskObj.assignedTo) {
      taskObj.assignedTo = taskObj.assignedTo.filter((user: any) => user !== null);
    }

    // Calculate additional information
    const isOverdue = task.dueDate && new Date() > new Date(task.dueDate) && task.status !== "completed";
    const daysRemaining = task.dueDate 
      ? Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) 
      : null;

    logger.info(`Fetched task: id=${taskId}`);
    return res.status(200).json({
      success: true,
      data: {
        task: taskObj,
        isOverdue,
        daysRemaining,
      },
      message: "Successfully fetched task",
    });
  } catch (err: any) {
    logger.error("Error fetching task", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching task",
      error: err.message,
    });
  }
};

export const updateTask = async (req: Request<{ id: string }, {}, TaskBody>, res: Response) => {
  try {
    const taskId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      logger.warn(`Task not found: id=${taskId}`);
      return res.status(404).json({
        success: false,
        message: "Task not found",
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

    const { title, description, room, assignedTo, createdBy, status, dueDate } = req.body;

    // Validate status transitions
    if (task.status === "completed" && status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Completed tasks cannot change status",
      });
    }
    
    if (task.status === "in-progress" && status === "pending") {
      return res.status(400).json({
        success: false,
        message: "Cannot change from 'in-progress' to 'pending'",
      });
    }

    // Validate room exists
    if (room) {
      const roomExists = await Room.findById(room);
      if (!roomExists) {
        return res.status(400).json({
          success: false,
          message: "Room not found",
        });
      }
    }

    // Validate createdBy user exists
    if (createdBy) {
      const creatorExists = await User.findById(createdBy);
      if (!creatorExists) {
        return res.status(400).json({
          success: false,
          message: "Creator user not found",
        });
      }
    }

    // Process assignedTo array
    let processedAssignedTo: string[] = [];
    if (assignedTo && Array.isArray(assignedTo)) {
      const userIds = assignedTo.filter(Boolean);
      const validUsers = await User.find({ 
        _id: { $in: userIds }, 
        role: "user" 
      }).lean("_id");
      
      const validUserIds = validUsers.map((user) => user._id.toString());
      processedAssignedTo = userIds.filter((userId) => validUserIds.includes(userId));
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        title: title.trim(),
        description: description ? description.trim() : undefined,
        room,
        assignedTo: processedAssignedTo,
        createdBy,
        status: status || "pending",
        dueDate: dueDate ? new Date(dueDate) : undefined,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    )
      .populate("room", "name")
      .populate("createdBy", "username")
      .populate("assignedTo", "username");

    logger.info(`Updated task: id=${taskId}, title=${title}`);

    return res.status(200).json({
      success: true,
      data: updatedTask,
      message: "Successfully updated task",
    });
  } catch (err: any) {
    logger.error("Error updating task", err);
    return res.status(500).json({
      success: false,
      message: "Error updating task",
      error: err.message,
    });
  }
};

export const updateTaskPartial = async (
  req: Request<{ id: string }, {}, Partial<TaskBody>>,
  res: Response
) => {
  try {
    const taskId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const updates: Partial<TaskBody & { updatedAt: Date }> = { ...req.body };

    // Validate status transitions if status is being updated
    if (updates.status) {
      if (task.status === "completed" && updates.status !== "completed") {
        return res.status(400).json({
          success: false,
          message: "Completed tasks cannot change status",
        });
      }
      
      if (task.status === "in-progress" && updates.status === "pending") {
        return res.status(400).json({
          success: false,
          message: "Cannot change from 'in-progress' to 'pending'",
        });
      }
    }

    // Process assignedTo if provided
    if (updates.assignedTo && Array.isArray(updates.assignedTo)) {
      const userIds = updates.assignedTo.filter(Boolean);
      const validUsers = await User.find({ 
        _id: { $in: userIds }, 
        role: "user" 
      }).lean("_id");
      
      const validUserIds = validUsers.map((user) => user._id.toString());
      updates.assignedTo = userIds.filter((userId) => validUserIds.includes(userId));
    }

    // Trim text fields if provided
    if (updates.title) {
      updates.title = updates.title.trim();
    }
    if (updates.description) {
      updates.description = updates.description.trim();
    }

    // Convert dueDate if provided
    if (updates.dueDate) {
      updates.dueDate = new Date(updates.dueDate) as any;
    }

    // Add updatedAt timestamp
    updates.updatedAt = new Date();

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate("room", "name")
      .populate("createdBy", "username")
      .populate("assignedTo", "username");

    logger.info(`Patched task: id=${taskId}`);
    return res.status(200).json({
      success: true,
      data: updatedTask,
      message: "Successfully patched task",
    });
  } catch (err: any) {
    logger.error("Error patching task", err);
    return res.status(500).json({
      success: false,
      message: "Error patching task",
      error: err.message,
    });
  }
};

export const deleteTask = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const taskId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      logger.warn(`Task not found: id=${taskId}`);
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    await Task.deleteOne({ _id: taskId });
    logger.info(`Deleted task: id=${taskId}`);

    return res.status(200).json({
      success: true,
      message: "Successfully deleted task",
    });
  } catch (err: any) {
    logger.error("Error deleting task", err);
    return res.status(500).json({
      success: false,
      message: "Error deleting task",
      error: err.message,
    });
  }
};

// Additional utility function to get tasks by room
export const getTasksByRoom = async (req: Request<{ roomId: string }>, res: Response) => {
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

    // Verify room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const query: Record<string, any> = { room: roomId };
    if (status) {
      query.status = status;
    }

    const totalTasks = await Task.countDocuments(query);
    const totalPages = Math.ceil(totalTasks / limit);

    const tasks = await Task.find(query)
      .populate("createdBy", "username")
      .populate("assignedTo", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Filter out null populated references
    const filteredTasks = tasks.map(task => {
      const taskObj = task.toObject();
      if (taskObj.assignedTo) {
        taskObj.assignedTo = taskObj.assignedTo.filter((user: any) => user !== null);
      } else {
        taskObj.assignedTo = [];
      }
      return taskObj;
    });

    return res.status(200).json({
      success: true,
      data: {
        tasks: filteredTasks,
        room: room,
        page: Number(page),
        totalPages,
        totalTasks,
        limit,
      },
      message: "Successfully fetched tasks for room",
    });
  } catch (err: any) {
    logger.error("Error fetching tasks by room", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching tasks by room",
      error: err.message,
    });
  }
};