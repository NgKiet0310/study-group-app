import mongoose, { Schema, Document, Model } from "mongoose";

interface INote extends Document {
  room: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  title: string;
  content: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

const NoteSchema: Schema<INote> = new Schema(
  {
    room: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: [true, "Room is required"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    title: {
      type: String,
      required: [true, "Note title is required"],
      trim: true,
      maxlength: [200, "Note title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: [true, "Note content is required"],
      trim: true,
      maxlength: [5000, "Note content cannot exceed 5000 characters"],
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Tạo index
NoteSchema.index({ room: 1, createdAt: -1 });

// Ngăn chặn OverwriteModelError
const Note: Model<INote> = mongoose.models.Note || mongoose.model<INote>("Note", NoteSchema);

export default Note;