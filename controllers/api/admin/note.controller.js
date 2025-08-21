import Note from '../../../models/Note.js';
import Room from '../../../models/Room.js';
import User from '../../../models/User.js';
import logger from '../../../utils/logger.js';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';

export const getNotes = async(req,res) => {
    const {search, room, isPublic, page = 1} = req.query;
    const limit = 5;
    const skip = (page - 1)*limit;
    try {
        let query = {};
        if(search){
            query.title = {$regex: search, $options: 'i'};
        }
        if(room){
            query.room = room;
        }
        if( isPublic !== undefined){
            query.isPublic = isPublic === 'true';
        }
        const totalNotes = await Note.countDocuments(query);
        const totalPages = Math.ceil(totalNotes / limit);
        const notes = await Note.find(query)
        .populate('room','name')
        .populate('createdBy','username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

        logger.info(`Successfully fetched notes list: ${page} , totalNotes: ${totalNotes}`);
        res.status(200).json({
            success: true, data: {notes,  page: parseInt(page), totalPages, totalNotes, limit},
            message: 'Successfully fetched notes list'
        });
    } catch (err) {
        logger.error("Error fetching notes list", err.message);
        res.status(500).json({
            success: false,
            message: 'Error fetching notes list',
            error: err.message
        });
    }
}

export const createNote = async(req, res) => {
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            logger.warn(`Validation error while creating note ${errors.array[0].msg}`, {errors: errors.array()});
            return res.status(400).json({
                success:false, message:'Invalid input data',error: errors.array()[0].msg
            });
        }
        const {title, content, room, createdBy, isPublic} = req.body;
        if (!mongoose.Types.ObjectId.isValid(room)) {
           return res.status(400).json({ error: "Invalid room ID" });
        }
        if (!mongoose.Types.ObjectId.isValid(createdBy)) {
           return res.status(400).json({ error: "Invalid user ID" });
        }
        const newNote = new Note({
            title, content, isPublic: isPublic === true || isPublic === 'true', createdAt: Date.now(),
            room: new mongoose.Types.ObjectId(room),
            createdBy: new mongoose.Types.ObjectId(createdBy),
        });  
        await newNote.save();
        logger.info(`Successfully created note , title: ${title}, createdBy: ${createdBy}`);
        res.status(200).json({
            success: true, data: newNote, message: 'Successfully created note'
        });
    } catch (err) {
        logger.error(`Error creating note: ${err.message}`, {error: err});
        res.status(500).json({
            success: false, message: 'Error creating note', errror: err.message
        });
    }
}

export const getNoteById = async(req, res) => {
    try {
        const noteId = req.params.id;
        const note = await Note.findById(noteId)
        .populate('room','name')
        .populate('createdBy','username')
        if(!note){
            logger.warn(`Note not found, ID: ${noteId}`);
            return res.status(404).json({
                success: false, message: 'Note not found'
            });
        }
        logger.info(`Successfully fetched note, ID: ${noteId}`);
        res.status(200).json({
            success: true, data: note, message: 'Successfully fetched note'
        });
    } catch (err) {
        logger.error(`Error fetching note: ${err.message}`, {error: err});
        res.status(500).json({
            success: false, message: 'Error fetching note', error: err.message
        });
    }
}

export const updateNote = async(req, res) => {
    try {
        const noteId = req.params.id;
        const note = await Note.findById(noteId);
        if(!note){
            logger.warn(`Note not found, ID: ${noteId} `);
            return res.status(404).json({
                success: false, message: 'Note not found'
            });
        }
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            logger.warn(`Validation error while creating note ${errors.array[0].msg}`, {errors: errors.array()});
            return res.status(400).json({
                success:false, message:'Invalid input data',error: errors.array()[0].msg
            });
        }
        const {title, content, room, createdBy, isPublic} = req.body;
        if (!mongoose.Types.ObjectId.isValid(room)) {
           return res.status(400).json({ error: "Invalid room ID" });
        }
        if (!mongoose.Types.ObjectId.isValid(createdBy)) {
           return res.status(400).json({ error: "Invalid user ID" });
        }
        note.title = title;
        note.content = content;
        note.room = room;
        note.createdBy = createdBy;
        note.isPublic = isPublic === true || isPublic === "true";
        note.createdAt = Date.now();
        await note.save();
        logger.info(`Successfully updated note: ID: ${noteId}, title: ${title}`);
        res.status(200).json({
            success: true, data: note, message: 'Successfully updated note'
        });
    } catch (err) {
        logger.error(`Error updating note ${err.message}`, {error: err});
        return res.status(500).json({
            success: false, message: 'Error updating note', error: err.message
        });
    }
}

export const deleteNote = async(req, res) => {
    try {
        const noteId = req.params.id;
        const note = await Note.findById(noteId);
        if(!noteId){
            logger.warn(`Note not found: ID: ${noteId}`);
            return res.status(404).json({
                success : false, message: 'Note not found'
            });
        }
        await Note.deleteOne({ _id: noteId});
        logger.info(`Successfully deleted note`);
        return res.status(200).json({
            success: true, message: 'Successfully deleted note'
        });
    } catch (err) {
        logger.error(`Error deleting note: ${err,message}`, {error: err});
        res.status(500).json({
            success: false,
            message: 'Error deleting note',
            error: err.message
        });
    }
}