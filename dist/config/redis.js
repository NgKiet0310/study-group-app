import chalk from "chalk";
import { createClient } from "redis";
const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
});
redisClient.on("error", (err) => console.log("Redis error", err));
export const connectRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
        console.log(chalk.blue('✅ Connect Redis successfully!'));
    }
};
export default redisClient;
//# sourceMappingURL=redis.js.map