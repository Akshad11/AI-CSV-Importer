import { AsyncLocalStorage } from "node:async_hooks";
import { logger, Logger, LogContext } from "./logger";

export interface LogStore {
    requestId: string;
}

export const logLocalStorage = new AsyncLocalStorage<LogStore>();

export class LoggerService {
    /**
     * Run a function within a specific logging context (e.g. Request ID)
     */
    static runWithContext<T>(context: LogStore, fn: () => T): T {
        return logLocalStorage.run(context, fn);
    }

    /**
     * Retrieve a request-bound logger or fallback to global logger
     */
    static getLogger(): Logger {
        return logger;
    }

    /**
     * Create a context-bound logging helper for a specific module
     */
    static createModuleLogger(moduleName: string) {
        return {
            info: (message: string, context?: LogContext) => logger.info(message, { module: moduleName, ...context }),
            success: (message: string, context?: LogContext) => logger.success(message, { module: moduleName, ...context }),
            warning: (message: string, context?: LogContext) => logger.warning(message, { module: moduleName, ...context }),
            error: (message: string, context?: LogContext) => logger.error(message, { module: moduleName, ...context }),
            debug: (message: string, context?: LogContext) => logger.debug(message, { module: moduleName, ...context }),
            trace: (message: string, context?: LogContext) => logger.trace(message, { module: moduleName, ...context }),
            fatal: (message: string, context?: LogContext) => logger.fatal(message, { module: moduleName, ...context }),
        };
    }
}
