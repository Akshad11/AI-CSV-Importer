import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";

import routes from "./routes";

import { requestLogger } from "./middlewares/requestLogger.middleware";
import { requestIdMiddleware } from "./middlewares/requestId.middleware";
import { rateLimiter } from "./middlewares/rateLimiter.middleware";
import { notFoundMiddleware } from "./middlewares/notFound.middleware";
import { errorHandler } from "./errors/errorHandler";

import { env } from "./config/env";
import { logger } from "./logger/logger";
import { ErrorLogger } from "./logger/ErrorLogger";
import { mongoConnection } from "./database/connection";
import { DatabaseSeeder } from "./database/seeders/DatabaseSeeder";

// Register process-wide exception and rejection interceptors
ErrorLogger.registerHandlers();

// Log application startup stages
logger.info("Environment variables loaded.", { module: "System", action: "Environment Loaded", status: "SUCCESS" });
logger.info("Application configuration initialized.", { module: "System", action: "Configuration Loaded", status: "SUCCESS" });
logger.info("Application starting...", { module: "System", action: "Application Startup", status: "SUCCESS" });

const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(cors({
    origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    credentials: true,
}));

app.use(compression());

app.use(requestIdMiddleware);

app.use(requestLogger);

app.use(rateLimiter);

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true,
    })
);

app.use("/", routes);

app.use(notFoundMiddleware);

app.use(errorHandler);

const PORT = env.PORT;

const start = async () => {
    try {
        await mongoConnection.connect();
        await DatabaseSeeder.seed();
        
        const server = app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`, { module: "System", action: "Server Started", status: "SUCCESS" });
        });

        const gracefulShutdown = async (signal: string) => {
            logger.info(`Received ${signal}. Shutting down gracefully...`, { module: "System", action: "Graceful Shutdown", status: "SUCCESS" });
            server.close(async () => {
                await mongoConnection.disconnect();
                logger.info("HTTP server closed. Application shutdown complete.", { module: "System", action: "Application Shutdown", status: "SUCCESS" });
                process.exit(0);
            });
        };

        process.on("SIGINT", () => gracefulShutdown("SIGINT"));
        process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    } catch (error: any) {
        logger.fatal(`Failed to start server: ${error.message}`, error);
        process.exit(1);
    }
};

start();

export default app;