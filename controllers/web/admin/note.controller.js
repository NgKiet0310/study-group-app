import Note from '../../../models/Note.js';
import Room from '../../../models/Room.js';
import User from '../../../models/User.js';
import { validationResult } from 'express-validator';

export const showNotes = async(req, res) => {
    const {search, room, isPublic, page = 1} = req.query;
    const limit = 5;
    const skip = (page - 1) * limit;
    
    try {
        let query = {};
        if(search){
            query.title = {$regex: search, $options: 'i'};
        }
        if(room){
            query.room = room;
        }
        if(isPublic !== undefined){
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

        const rooms = await Room.find().select('name');
        const error = req.query.error;
        const success = req.query.success;

        res.render('admin/pages/note/manage-note', {
            notes,
            path: req.path,
            rooms,
            success,
            error,
            search,
            room,
            isPublic,
            page: parseInt(page),
            totalPages,
            limit
        })
    } catch (err) {
        console.error('Lỗi khi tải danh sách ghi chú', err);
        res.status(500).render('admin/pages/note/manage-note',{
            notes: [],
            rooms: [],
            path: req.path,
            error: 'Lỗi khi tải danh sách ghi chú',
            success: null,
            search: '',
            room: '',
            isPublic: '',
            page: 1,
            totalPages: 1,
            limit: 5
        });
    }
}

export const showCreateForm = async(req, res) => {
    try {
        const rooms = await Room.find().select('name');
        const users = await User.find().select('username');
        res.render('admin/pages/note/form-create', {
            rooms,
            users,
            path: req.path,
            error: null,
            success: null
        });
    } catch (error) {
        console.error('Lỗi khi hiển thị form tạo ghi chú');
        res.status(500).render('admin/pages/note/form-create',{
            rooms: [],
            users: [],
            error: 'Lỗi khi hiển thị form tạo ghi chú',
            success: null
        });
    }
}

export const createNote = async(req, res) => {
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            const rooms = await Room.find().select('name');
            const users = await User.find().select('username');
            return res.status(400).render('admin/pages/note/form-create',{
                rooms,
                users,
                path: req.path,
                error: errors.array()[0].msg,
                success: null
            });
        }
        const {title, content, room, createdBy, isPublic} = req.body;

        const newNote = new Note({
            title,
            content,
            room,
            createdBy,
            isPublic: isPublic === 'true',
            createdAt: Date.now()
        });

        await newNote.save();
        res.redirect('/admin/note?success=Tạo ghi chú thành công');
    } catch (error) {
        console.error('Lỗi khi tạo ghi chú', error);
        const rooms = await Room.find().select('name');
        const users = await User.find().select('username');
        res.status(500).render('admin/pages/note/form-create',{
            rooms,
            users,
            path: req.path,
            error: 'Đã có lỗi xảy ra khi tạo',
            success: null
        });
    }
}

export const showEditForm = async(req, res) => {
    try {
        const noteId = req.params.id;
        const note = await Note.findById(noteId)
        .populate('room','name')
        .populate('createdBy','username');
        if(!note){
            return res.redirect('/admin/note?error=Ghi chú không tồn tại');
        }
         const rooms = await Room.find().select('name');
        const users = await User.find().select('username');
        res.render('admin/pages/note/form-edit',{
            note,
            rooms,
            users,
            path: req.path,
            error: null,
            success: null
        });
    } catch (error) {
        console.error('Lỗi khi hiển thị form sửa', error);
        res.redirect('/admin/note?error=Lỗi khi hiển thị form sửa');
    }
}

export const editNote = async(req,res) => {
    try {
        const noteId = req.params.id;
        const note = await Note.findById(noteId);
        if(!note){
            return res.redirect('/admin/note?error=Ghi chú không tồn tại');
        }
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            const rooms = await Room.find().select('name');
            const users = await User.find().select('username');
            return res.status(400).render('admin/pages/note/form-edit',{
                note,
                rooms,
                users,
                path: req.path,
                error: errors.array()[0].msg,
                success: null
            });
        }
        const { title, content, room, createdBy, isPublic} = req.body;
        note.title = title;
        note.content = content;
        note.room = room;
        note.createdBy = createdBy;
        note.isPublic = isPublic === 'true';
        note.createdAt = Date.now();

        await note.save()
        res.redirect('/admin/note?success=Chỉnh sửa ghi chú thành công');
    } catch (error) {
        console.error('Lỗi khi chỉnh sửa', error);
        const rooms = await Room.find().select('name');
        const users = await User.find().select('username');
        res.status(500).render('admin/pages/note/form-edit-note', {
            note,
            rooms,
            users,
            path: req.path,
            error: 'Đã có lỗi xảy ra khi chỉnh sửa ghi chú',
            success: null
        });
    }
}

export const showNoteDetail = async (req, res) => {
    try {
        const noteId = req.params.id;
        const note = await Note.findById(noteId)
        .populate('room','name')
        .populate('createdBy','username');
        if(!note){
            return res.redirect('admin/note?error=Ghi chú không tồn tại');
        }
        res.render('admin/pages/note/note-detail', {
            note,
            path:req.path,
            error: null,
            success:null
        });
    } catch (error) {
        console.error('Lỗi khi hiển thị chi tiết', error);
        res.redirect('/admin/note?error=Lỗi khi hiển thị');
    }
}

export const deleteNote = async(req, res) => {
    try {
        const noteId = req.params.id;
        const note = await Note.findById(noteId);
        if(!note){
            return res.redirect('/admin/note?error=Ghi chú không tồn tại');
        }
        await Note.deleteOne({ _id: noteId});
        res.redirect('/admin/note?success=Xóa ghi chú thành công');
    } catch (error) {
        console.error('Lỗi khi xóa ghi chú', error);
        res.redirect('/admin/note?error=Xóa ghi chú không thành công');
    }
}