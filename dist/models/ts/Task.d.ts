import mongoose, { Document, Model } from "mongoose";
interface ITask extends Document {
    room: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    status: "pending" | "in-progress" | "completed";
    assignedTo: mongoose.Types.ObjectId[];
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    dueDate?: Date;
    updatedAt?: Date;
}
declare const Task: Model<ITask>;
export default Task;
//# sourceMappingURL=Task.d.ts.map