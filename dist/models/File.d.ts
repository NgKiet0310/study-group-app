declare const _default: mongoose.Model<any, {}, {}, {}, any, any> | mongoose.Model<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    room: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    uploadedBy: mongoose.Types.ObjectId;
    fileName: string;
    fileUrl: string;
    fileType: "pdf" | "image" | "doc" | "other";
    fileSize: number;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    room: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    uploadedBy: mongoose.Types.ObjectId;
    fileName: string;
    fileUrl: string;
    fileType: "pdf" | "image" | "doc" | "other";
    fileSize: number;
}, {}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    room: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    uploadedBy: mongoose.Types.ObjectId;
    fileName: string;
    fileUrl: string;
    fileType: "pdf" | "image" | "doc" | "other";
    fileSize: number;
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
    createdAt: NativeDate;
    uploadedBy: mongoose.Types.ObjectId;
    fileName: string;
    fileUrl: string;
    fileType: "pdf" | "image" | "doc" | "other";
    fileSize: number;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    room: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    uploadedBy: mongoose.Types.ObjectId;
    fileName: string;
    fileUrl: string;
    fileType: "pdf" | "image" | "doc" | "other";
    fileSize: number;
}>, {}> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    room: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    uploadedBy: mongoose.Types.ObjectId;
    fileName: string;
    fileUrl: string;
    fileType: "pdf" | "image" | "doc" | "other";
    fileSize: number;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default _default;
import mongoose from 'mongoose';
//# sourceMappingURL=File.d.ts.map