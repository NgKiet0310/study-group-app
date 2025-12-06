import mongoose, { Schema, Document, Model } from "mongoose";
import * as bcrypt from "bcrypt";
const UserSchema = new Schema({
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
}, { timestamps: true });
UserSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});
UserSchema.methods.comparePassword = async function (inputPassword) {
    if (typeof inputPassword !== "string" || typeof this.password !== "string") {
        throw new Error("data and hash must be strings");
    }
    return await bcrypt.compare(inputPassword, this.password);
};
UserSchema.index({ username: 1 });
const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
//# sourceMappingURL=User.js.map