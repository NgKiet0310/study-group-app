import mongoose, { Schema, Document, Model } from "mongoose";
const MessageSchema = new Schema({
    room: {
        type: Schema.Types.ObjectId,
        ref: "Room",
        required: [true, "Room is required"],
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Sender is required"],
    },
    content: {
        type: String,
        required: [true, "Message content is required"],
        trim: true,
        maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });
MessageSchema.index({ room: 1, createdAt: -1 });
const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);
export default Message;
//# sourceMappingURL=Message.js.map