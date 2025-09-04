import { type Request, type Response } from "express";
import { validationResult , type ValidationError } from "express-validator";
import mongoose from "mongoose";
import Note from "../../../models/ts/Note.js";
import logger from "../../../utils/logger.js";

interface GetNotesQuery {
  search?: string;
  room?: string;
  isPublic?: string;
  page?: string | number;
}

interface NoteBody {
  title: string;
  content: string;
  room: string;
  createdBy: string;
  isPublic?: boolean | string;
}


// GET /notes
export const getNotes = async (req: Request<{}, {}, {}, GetNotesQuery>, res: Response) => {
  const { search, room, isPublic, page = 1 } = req.query;
  const limit = 5;
  const skip = (Number(page) - 1) * limit;

  try {
    const query: Record<string, any> = {};

    if (search) query.title = { $regex: search, $options: "i" };
    if (room) query.room = room;
    if (isPublic !== undefined) query.isPublic = isPublic === "true";

    const totalNotes = await Note.countDocuments(query);
    const totalPages = Math.ceil(totalNotes / limit);

    const notes = await Note.find(query)
      .populate("room", "name")
      .populate("createdBy", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    logger.info(`Fetched notes: page=${page}, total=${totalNotes}`);

    return res.status(200).json({
      success: true,
      data: { notes, page: Number(page), totalPages, totalNotes, limit },
      message: "Successfully fetched notes list",
    });
  } catch (err: any) {
    logger.error("Error fetching notes list", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching notes list",
      error: err.message,
    });
  }
};

// POST /notes
export const createNote = async (req: Request<{}, {}, NoteBody>, res: Response) => {
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

    const { title, content, room, createdBy, isPublic } = req.body;

    if (!mongoose.Types.ObjectId.isValid(room)) {
      return res.status(400).json({ success: false, message: "Invalid room ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(createdBy)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const newNote = new Note({
      title,
      content,
      isPublic: isPublic === true || isPublic === "true",
      createdAt: Date.now(),
      room: new mongoose.Types.ObjectId(room),
      createdBy: new mongoose.Types.ObjectId(createdBy),
    });

    await newNote.save();
    logger.info(`Created note: title=${title}, createdBy=${createdBy}`);

    return res.status(201).json({
      success: true,
      data: newNote,
      message: "Successfully created note",
    });
  } catch (err: any) {
    logger.error("Error creating note", err);
    return res.status(500).json({
      success: false,
      message: "Error creating note",
      error: err.message,
    });
  }
};

export const getNoteById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const noteId = req.params.id;
    const note = await Note.findById(noteId)
      .populate("room", "name")
      .populate("createdBy", "username");

    if (!note) {
      logger.warn(`Note not found: id=${noteId}`);
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    logger.info(`Fetched note: id=${noteId}`);
    return res.status(200).json({
      success: true,
      data: note,
      message: "Successfully fetched note",
    });
  } catch (err: any) {
    logger.error("Error fetching note", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching note",
      error: err.message,
    });
  }
};

export const updateNote = async (req: Request<{ id: string }, {}, NoteBody>, res: Response) => {
  try {
    const noteId = req.params.id;
    const note = await Note.findById(noteId);

    if (!note) {
      logger.warn(`Note not found: id=${noteId}`);
      return res.status(404).json({ success: false, message: "Note not found" });
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

    const { title, content, room, createdBy, isPublic } = req.body;

    if (!mongoose.Types.ObjectId.isValid(room)) {
      return res.status(400).json({ success: false, message: "Invalid room ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(createdBy)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    note.title = title;
    note.content = content;
    note.room = new mongoose.Types.ObjectId(room);
    note.createdBy = new mongoose.Types.ObjectId(createdBy);
    note.isPublic = isPublic === true || isPublic === "true";
    note.createdAt = new Date();

    await note.save();
    logger.info(`Updated note: id=${noteId}, title=${title}`);

    return res.status(200).json({
      success: true,
      data: note,
      message: "Successfully updated note",
    });
  } catch (err: any) {
    logger.error("Error updating note", err);
    return res.status(500).json({
      success: false,
      message: "Error updating note",
      error: err.message,
    });
  }
};

export const updateNotePartial = async (
  req: Request<{ id: string }, {}, Partial<NoteBody>>,
  res: Response
) => {
  try {
    const noteId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({ success: false, message: "Invalid note ID" });
    }

    const updates: Partial<NoteBody> = { ...req.body };
    if (updates.isPublic !== undefined) {
      updates.isPublic = updates.isPublic === true || updates.isPublic === "true";
    }

    const note = await Note.findByIdAndUpdate(noteId, { $set: updates }, { new: true, runValidators: true })
      .populate("room", "name")
      .populate("createdBy", "username");

    if (!note) {
      logger.warn(`Note not found (PATCH): id=${noteId}`);
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    logger.info(`Patched note: id=${noteId}`);
    return res.status(200).json({
      success: true,
      data: note,
      message: "Successfully patched note",
    });
  } catch (err: any) {
    logger.error("Error patching note", err);
    return res.status(500).json({
      success: false,
      message: "Error patching note",
      error: err.message,
    });
  }
};


export const deleteNote = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const noteId = req.params.id;
    const note = await Note.findById(noteId);

    if (!note) {
      logger.warn(`Note not found: id=${noteId}`);
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    await Note.deleteOne({ _id: noteId });
    logger.info(`Deleted note: id=${noteId}`);

    return res.status(200).json({ success: true, message: "Successfully deleted note" });
  } catch (err: any) {
    logger.error("Error deleting note", err);
    return res.status(500).json({
      success: false,
      message: "Error deleting note",
      error: err.message,
    });
  }
};
