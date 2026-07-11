import { logger } from "./logger";

export class ErrorLogger {
    static registerHandlers(): void {
        process.on("uncaughtException", (error) => {
            logger.fatal("Uncaught Exception detected", {
                module: "System",
                action: "Unhandled Exception",
                status: "FATAL",
                error
            });
            // Give FileLogger queue a moment to write log.txt before exit
            setTimeout(() => {
                logger.info("System shutting down after fatal exception.", {
                    module: "System",
                    action: "Shutdown",
                    status: "SUCCESS"
                });
                process.exit(1);
            }, 1000);
        });

        process.on("unhandledRejection", (reason) => {
            logger.fatal("Unhandled Promise Rejection detected", {
                module: "System",
                action: "Unhandled Rejection",
                status: "FATAL",
                error: reason instanceof Error ? reason : new Error(String(reason))
            });
            setTimeout(() => {
                logger.info("System shutting down after fatal promise rejection.", {
                    module: "System",
                    action: "Shutdown",
                    status: "SUCCESS"
                });
                process.exit(1);
            }, 1000);
        });
    }
}
export default ErrorLogger;
