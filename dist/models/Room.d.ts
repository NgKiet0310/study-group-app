declare const _default: mongoose.Model<any, {}, {}, {}, any, any> | mongoose.Model<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    createdAt: NativeDate;
    name: string;
    code: string;
    admin: mongoose.Types.ObjectId;
    members: mongoose.Types.DocumentArray<{
        role: "host" | "member";
        user: mongoose.Types.ObjectId;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        role: "host" | "member";
        user: mongoose.Types.ObjectId;
    }> & {
        role: "host" | "member";
        user: mongoose.Types.ObjectId;
    }>;
    description?: string | null;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    createdAt: NativeDate;
    name: string;
    code: string;
    admin: mongoose.Types.ObjectId;
    members: mongoose.Types.DocumentArray<{
        role: "host" | "member";
        user: mongoose.Types.ObjectId;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        role: "host" | "member";
        user: mongoose.Types.ObjectId;
    }> & {
        role: "host" | "member";
        user: mongoose.Types.ObjectId;
    }>;
    description?: string | null;
}, {}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    createdAt: NativeDate;
    name: string;
    code: string;
    admin: mongoose.Types.ObjectId;
    members: mongoose.Types.DocumentArray<{
        role: "host" | "member";
        user: mongoose.Types.ObjectId;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        role: "host" | "member";
        user: mongoose.Types.ObjectId;
    }> & {
        role: "host" | "member";
        user: mongoose.Types.ObjectId;
    }>;
    description?: string | null;
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
    createdAt: NativeDate;
    name: string;
    code: string;
    admin: mongoose.Types.ObjectId;
    members: mongoose.Types.DocumentArray<{
        role: "host" | "member";
        user: mongoose.Types.ObjectId;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        role: "host" | "member";
        user: mongoose.Types.ObjectId;
    }> & {
        role: "host" | "member";
        user: mongoose.Types.ObjectId;
    }>;
    description?: string | null;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    createdAt: NativeDate;
    name: string;
    code: string;
    admin: mongoose.Types.ObjectId;
    members: mongoose.Types.DocumentArray<{
        role: "host" | "member";
        user: mongoose.Types.ObjectId;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        role: "host" | "member";
        user: mongoose.Types.ObjectId;
    }> & {
        role: "host" | "member";
        user: mongoose.Types.ObjectId;
    }>;
    description?: string | null;
}>, {}> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    createdAt: NativeDate;
    name: string;
    code: string;
    admin: mongoose.Types.ObjectId;
    members: mongoose.Types.DocumentArray<{
        role: "host" | "member";
        user: mongoose.Types.ObjectId;
    }, mongoose.Types.Subdocument<mongoose.Types.ObjectId, any, {
        role: "host" | "member";
        user: mongoose.Types.ObjectId;
    }> & {
        role: "host" | "member";
        user: mongoose.Types.ObjectId;
    }>;
    description?: string | null;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default _default;
import mongoose from 'mongoose';
//# sourceMappingURL=Room.d.ts.map