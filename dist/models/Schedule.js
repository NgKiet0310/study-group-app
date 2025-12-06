import mongoose from 'mongoose';
const { Schema } = mongoose;
const ScheduleSchema = new Schema({
    room: {
        type: Schema.Types.ObjectId,
        ref: 'Room',
        required: [true, 'Room is required']
    },
    title: {
        type: String,
        required: [true, 'Schedule title is required'],
        trim: true,
        maxlength: [200, 'Schedule title cannot exceed 200 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    startTime: {
        type: Date,
        required: [true, 'Start time is required']
    },
    endTime: {
        type: Date
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator is required']
    },
    participants: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });
// Index để tìm kiếm lịch theo phòng
ScheduleSchema.index({ room: 1, createdAt: -1 });
export default mongoose.models.Schedule || mongoose.model('Schedule', ScheduleSchema);
//# sourceMappingURL=Schedule.js.map