import mongoose, { Document, Model } from "mongoose";
interface INote extends Document {
    room: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    title: string;
    content: string;
    isPublic: boolean;
    createdAt: Date;
    updatedAt?: Date;
}
declare const Note: Model<INote>;
export default Note;
//# sourceMappingURL=Note.d.ts.map