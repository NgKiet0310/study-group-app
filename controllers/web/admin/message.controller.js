import  Room  from "../../../models/Room.js";
import  Message  from "../../../models/Message.js";

export const showMessages = async(req,res) =>{
    const {search, room, page = 1} = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;
    try {
        let query = {};
        if(search){
            query.content = {$regex: search, $options: 'i'};
        }
        if(room){
            query.room = room;
        }

        const totalMessages = await Message.countDocuments(query);
        const totalPages = Math.ceil(totalMessages / limit);

        const messages = await Message.find(query)
        .populate('room','name')
        .populate('sender','username')
        .sort({createdAt: -1})
        .skip(skip)
        .limit(limit);

        const rooms = await Room.find().select('name');
        const error = req.query.error;
        const success = req.query.success;
        res.render('admin/pages/message/manage-messages',{
            messages, rooms, path:req.path, error,success,search,room,page: parseInt(page) , totalPages, limit
        });
    } catch (error) {
        console.error('Lỗi danh sách tin nhắn:', err);
    res.render('admin/pages/message/manage-messages', {
      messages: [], rooms: [], path: req.path, error: 'Lỗi tải danh sách tin nhắn',
      search: '', room: '', page: 1, totalPages: 1, limit
    });
    }
}

export const showMessageDetail = async(req,res) => {
    try {
        const messageId = req.params.id;
        const message = await Message.findById(messageId)
        .populate('room','name')
        .populate('sender','username');
        if(!message){
            return res.redirec('/admin/messages?error=Tin nhắn không tồn tại');
        }
        res.render('admin/pages/message/message-detail',{
            message,
            path:req.path,
            error:null
        });
    } catch (error) {
        console.error('Lỗi khi hiển thị chi tiết tin nhắn', error);
        res.redirec('/admin/messages?error=Đã có lỗi');
    }
}

export const deleteMessage = async(req,res) => {
    try {
        const messageId = req.params.id;
        const message = await Message.findById(messageId);
        if(!message){
            return res.redirec('/admin/messages?error=Tin nhắn không tồn tại');
        }
        await Message.deleteOne({ _id: messageId});
        res.redirec('/admin/messages?success=Xóa tin nhắn thành công');
    } catch (error) {
        console.error('Lỗi khi xóa tin nhắn', error);
        res,redirec('/admin/messages?error=Đã có lỗi xảy ra khi xóa tin nhắn');
    }
}