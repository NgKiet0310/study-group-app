import mongoose, { Schema, Document, Model } from "mongoose";
const TaskSchema = new Schema({
    room: {
        type: Schema.Types.ObjectId,
        ref: "Room",
        required: [true, "Room is required"],
    },
    title: {
        type: String,
        required: [true, "Task title is required"],
        trim: true,
        maxlength: [200, "Task title cannot exceed 200 characters"],
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    status: {
        type: String,
        enum: ["pending", "in-progress", "completed"],
        default: "pending",
    },
    assignedTo: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Creator is required"],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    dueDate: {
        type: Date,
    },
}, { timestamps: true });
TaskSchema.index({ room: 1, createdAt: -1 });
const Task = mongoose.models.Task || mongoose.model("Task", TaskSchema);
export default Task;
//# sourceMappingURL=Task.js.map