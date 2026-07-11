import mongoose from "mongoose";
import { env } from "../config/env";
import { logger } from "../logger/logger";

export interface DatabaseHealth {
    available: boolean;
    latencyMs?: number;
    error?: string;
}

export class MongoConnection {
    private isGracefullyClosing = false;
    private maxRetries = 5;
    private retryDelayMs = 5000;

    constructor() {
        // Handle Mongoose events
        mongoose.connection.on("connected", () => {
            logger.info("MongoDB connection established successfully", {
                module: "Database",
                action: "Connect",
                status: "SUCCESS"
            });
        });

        mongoose.connection.on("error", (err) => {
            if (!this.isGracefullyClosing) {
                logger.error("MongoDB connection encountered error", err, {
                    module: "Database",
                    action: "Error",
                    status: "FAILED"
                });
            }
        });

        mongoose.connection.on("disconnected", () => {
            if (!this.isGracefullyClosing) {
                logger.warning("MongoDB disconnected. Attempting auto-reconnect...", {
                    module: "Database",
                    action: "Disconnect",
                    status: "WARNING"
                });
            }
        });
    }

    /**
     * Connect to MongoDB with retries.
     */
    public async connect(): Promise<void> {
        let attempt = 1;
        while (attempt <= this.maxRetries) {
            try {
                logger.info(`Connecting to MongoDB... (Attempt ${attempt}/${this.maxRetries})`, {
                    module: "Database",
                    action: "Connect",
                    status: "PENDING",
                    uri: env.MONGODB_URI.replace(/:([^:@]+)@/, ":********@") // Mask password if present
                });

                await mongoose.connect(env.MONGODB_URI, {
                    maxPoolSize: env.MONGODB_POOL_SIZE,
                    connectTimeoutMS: env.MONGODB_CONNECT_TIMEOUT_MS,
                    autoIndex: true
                });

                return; // Connected successfully!
            } catch (error: any) {
                logger.error(`MongoDB connection failed (Attempt ${attempt}/${this.maxRetries}): ${error.message}`, error, {
                    module: "Database",
                    action: "Connect",
                    status: "FAILED"
                });

                attempt++;
                if (attempt <= this.maxRetries) {
                    await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs));
                } else {
                    throw new Error(`Failed to connect to MongoDB after ${this.maxRetries} attempts`);
                }
            }
        }
    }

    /**
     * Performs a database health check.
     */
    public async health(): Promise<DatabaseHealth> {
        if (mongoose.connection.readyState !== 1) {
            return {
                available: false,
                error: `MongoDB state is ${mongoose.connection.readyState} (1 is connected)`
            };
        }

        try {
            const start = Date.now();
            // Perform a lightweight admin command to verify round-trip
            await mongoose.connection.db?.admin().ping();
            const latencyMs = Date.now() - start;

            return {
                available: true,
                latencyMs
            };
        } catch (error: any) {
            return {
                available: false,
                error: error.message
            };
        }
    }

    /**
     * Gracefully terminates the connection.
     */
    public async disconnect(): Promise<void> {
        this.isGracefullyClosing = true;
        logger.info("Closing MongoDB connection pool...", {
            module: "Database",
            action: "Disconnect",
            status: "PENDING"
        });

        try {
            await mongoose.disconnect();
            logger.info("MongoDB connection pool closed successfully", {
                module: "Database",
                action: "Disconnect",
                status: "SUCCESS"
            });
        } catch (error: any) {
            logger.error("Error closing MongoDB connection pool", error, {
                module: "Database",
                action: "Disconnect",
                status: "FAILED"
            });
        }
    }
}

export const mongoConnection = new MongoConnection();
