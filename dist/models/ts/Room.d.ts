import mongoose, { Document, Model } from "mongoose";
interface IMember {
    user: mongoose.Types.ObjectId;
    role: "host" | "member";
}
interface IRoom extends Document {
    name: string;
    description?: string;
    code: string;
    admin: mongoose.Types.ObjectId;
    members: IMember[];
    createdAt: Date;
    updatedAt?: Date;
}
declare const Room: Model<IRoom>;
export default Room;
//# sourceMappingURL=Room.d.ts.map