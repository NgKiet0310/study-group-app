import mongoose, { Schema, Document, Model } from "mongoose";

interface ISchedule extends Document {
  room: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  createdBy: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt?: Date;
}

const ScheduleSchema: Schema<ISchedule> = new Schema(
  {
    room: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: [true, "Room is required"],
    },
    title: {
      type: String,
      required: [true, "Schedule title is required"],
      trim: true,
      maxlength: [200, "Schedule title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

ScheduleSchema.index({ room: 1, createdAt: -1 });

const Schedule: Model<ISchedule> = mongoose.models.Schedule || mongoose.model<ISchedule>("Schedule", ScheduleSchema);