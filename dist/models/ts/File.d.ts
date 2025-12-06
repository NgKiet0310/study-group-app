import mongoose, { Document, Model } from "mongoose";
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
declare const File: Model<IFile>;
export default File;
//# sourceMappingURL=File.d.ts.map