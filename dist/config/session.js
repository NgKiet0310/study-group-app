import session from "express-session";
import MongoStore from "connect-mongo";
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/study-group-app';
export const sessionOptions = {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl,
        collectionName: 'sessions',
    }),
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24,
    },
};
//# sourceMappingURL=session.js.map