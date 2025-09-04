import mongoose, { Schema, Document, Model } from "mongoose";

interface IFile extends Document {
  room: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  fileName: string;
  fileUrl: string;
  fileType: "pdf" | "image" | "doc" | "other";
  fileSize: number;
  createdAt: Date;
  updatedAt?: Date;
}

const FileSchema: Schema<IFile> = new Schema(
  {
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
  },
  { timestamps: true }
);

FileSchema.index({ room: 1, createdAt: -1 });

const File: Model<IFile> = mongoose.models.File || mongoose.model<IFile>("File", FileSchema);

