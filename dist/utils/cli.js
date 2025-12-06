import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import mongoose from "mongoose";
import chalk from "chalk";
import dotenv from "dotenv";
import logger from "../utils/logger.js";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
dotenv.config();
async function connectDB(mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017/study-group-app") {
    try {
        await mongoose.connect(mongoUrl);
        console.log(chalk.blue(`CLI connect successfully to MongoDB: ${mongoUrl}`));
    }
    catch (error) {
        console.log(chalk.red(`CLI Error: ${error.message}`));
        process.exit(1);
    }
}
yargs(hideBin(process.argv))
    .command({
    command: "create-user",
    describe: "Tạo user mới",
    builder: {
        username: { type: "string", demandOption: true, describe: "Tên user" },
        password: { type: "string", demandOption: true, describe: "Mật khẩu" },
        role: { type: "string", default: "user", describe: "admin hoặc user" },
    },
    handler: async (argv) => {
        await connectDB();
        try {
            const existingUser = await User.findOne({ username: argv.username });
            if (existingUser) {
                logger.warn(`CLI: Username exists: ${argv.username}`);
                console.log(chalk.red(`❌ CLI: Username already exists: ${argv.username}`));
                await mongoose.disconnect();
                process.exit(1);
            }
            const user = new User({
                username: argv.username,
                password: argv.password,
                role: argv.role,
            });
            await user.save();
            logger.info(`CLI: User created ${argv.username}`);
            console.log(chalk.green(`✅ CLI: User created successfully: ${argv.username}`));
            await mongoose.disconnect();
            process.exit(0);
        }
        catch (error) {
            logger.error(`CLI Error: ${error.message}`);
            console.log(chalk.red(`CLI Error: ${error.message}`));
            await mongoose.disconnect();
            process.exit(1);
        }
    },
})
    .help()
    .version("1.0.0")
    .parse();
//# sourceMappingURL=cli.js.map