import mongoose, { Document, Model } from "mongoose";
interface IMessage extends Document {
    room: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
    updatedAt?: Date;
}
declare const Message: Model<IMessage>;
export default Message;
//# sourceMappingURL=Message.d.ts.map