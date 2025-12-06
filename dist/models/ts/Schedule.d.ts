import mongoose, { Document, Model } from "mongoose";
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
declare const Schedule: Model<ISchedule>;
export default Schedule;
//# sourceMappingURL=Schedule.d.ts.map