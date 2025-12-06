import { Document, Model } from "mongoose";
interface IUser extends Document {
    username: string;
    password: string;
    role: "user" | "admin";
    refreshToken?: string;
    createdAt: Date;
    updatedAt?: Date;
    comparePassword(inputPassword: string): Promise<boolean>;
}
declare const User: Model<IUser>;
export default User;
//# sourceMappingURL=User.d.ts.map