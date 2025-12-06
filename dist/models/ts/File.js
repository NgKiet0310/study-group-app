import mongoose, { Schema, Document, Model } from "mongoose";
const FileSchema = new Schema({
    room: {
        type: Schema.Types.ObjectId,
        ref: "Room",
        required: [true, "Room is required"],
    },
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Uploader is required"],
    },
    fileName: {
        type: String,
        required: [true, "File name is required"],
        trim: true,
        maxlength: [200, "File name cannot exceed 200 characters"],
    },
    fileUrl: {
        type: String,
        required: [true, "File URL is required"],
        trim: true,
    },
    fileType: {
        type: String,
        enum: ["pdf", "image", "doc", "other"],
        required: [true, "File type is required"],
    },
    fileSize: {
        type: Number,
        required: [true, "File size is required"],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });
FileSchema.index({ room: 1, createdAt: -1 });
const File = mongoose.models.File || mongoose.model("File", FileSchema);
export default File;
//# sourceMappingURL=File.js.map