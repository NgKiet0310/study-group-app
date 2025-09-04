import mongoose, { Schema, Document, Model } from "mongoose";
import * as bcrypt from "bcrypt";


interface IUser extends Document {
  username: string;
  password: string;
  role: "user" | "admin";
  refreshToken?: string;
  createdAt: Date;
  updatedAt?: Date;
  comparePassword(inputPassword: string): Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [50, "Username cannot exceed 50 characters"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    refreshToken: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

UserSchema.methods.comparePassword = async function (inputPassword: string): Promise<boolean> {
  if (typeof inputPassword !== "string" || typeof this.password !== "string") {
    throw new Error("data and hash must be strings");
  }
  return await bcrypt.compare(inputPassword, this.password);
};

UserSchema.index({ username: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;