declare const _default: mongoose.Model<any, {}, {}, {}, any, any> | mongoose.Model<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    room: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    title: string;
    createdAt: NativeDate;
    status: "pending" | "in-progress" | "completed";
    assignedTo: mongoose.Types.ObjectId[];
    description?: string | null;
    dueDate?: NativeDate | null;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    room: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    title: string;
    createdAt: NativeDate;
    status: "pending" | "in-progress" | "completed";
    assignedTo: mongoose.Types.ObjectId[];
    description?: string | null;
    dueDate?: NativeDate | null;
}, {}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    room: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    title: string;
    createdAt: NativeDate;
    status: "pending" | "in-progress" | "completed";
    assignedTo: mongoose.Types.ObjectId[];
    description?: string | null;
    dueDate?: NativeDate | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    room: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    title: string;
    createdAt: NativeDate;
    status: "pending" | "in-progress" | "completed";
    assignedTo: mongoose.Types.ObjectId[];
    description?: string | null;
    dueDate?: NativeDate | null;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    room: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    title: string;
    createdAt: NativeDate;
    status: "pending" | "in-progress" | "completed";
    assignedTo: mongoose.Types.ObjectId[];
    description?: string | null;
    dueDate?: NativeDate | null;
}>, {}> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    room: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    title: string;
    createdAt: NativeDate;
    status: "pending" | "in-progress" | "completed";
    assignedTo: mongoose.Types.ObjectId[];
    description?: string | null;
    dueDate?: NativeDate | null;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default _default;
import mongoose from 'mongoose';
//# sourceMappingURL=Task.d.ts.map