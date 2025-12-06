export namespace sessionOptions {
    let secret: string;
    let resave: boolean;
    let saveUninitialized: boolean;
    let store: MongoStore;
    namespace cookie {
        let httpOnly: boolean;
        let maxAge: number;
    }
}
import MongoStore from "connect-mongo";
//# sourceMappingURL=session.d.ts.map