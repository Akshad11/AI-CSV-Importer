import { LogLevel, LogLevels } from "./LogLevels";
import { ConsoleLogger } from "./ConsoleLogger";
import { FileLogger } from "./FileLogger";
import { env } from "../config/env";
import { ILogger } from "../core/interfaces/ILogger";
import { logLocalStorage } from "./LoggerService";

export interface LogContext {
    requestId?: string;
    module?: string;
    action?: string;
    status?: string;
    error?: any;
    message?: string;
    [key: string]: any;
}

export class Logger implements ILogger {
    private static formatTimestamp(): string {
        const d = new Date();
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

    private static parseArgs(
        level: LogLevel,
        arg1: string | LogContext,
        arg2?: LogContext
    ): {
        timestamp: string;
        requestId: string;
        level: LogLevel;
        module: string;
        action: string;
        status: string;
        message: string;
        error?: string;
        stack?: string;
    } {
        const timestamp = this.formatTimestamp();
        const store = logLocalStorage.getStore();

        let requestId = store?.requestId || "n/a";
        let module = "";
        let action = "";
        let status = "";
        let message = "";
        let errorObj: any = undefined;

        if (typeof arg1 === "string") {
            message = arg1;
            if (arg2) {
                if (arg2.requestId) requestId = arg2.requestId;
                if (arg2.module) module = arg2.module;
                if (arg2.action) action = arg2.action;
                if (arg2.status) status = arg2.status;
                if (arg2.error) errorObj = arg2.error;
            }
        } else if (arg1 && typeof arg1 === "object") {
            message = arg1.message || "";
            if (arg1.requestId) requestId = arg1.requestId;
            if (arg1.module) module = arg1.module;
            if (arg1.action) action = arg1.action;
            if (arg1.status) status = arg1.status;
            if (arg1.error) errorObj = arg1.error;
        }

        // Auto-detect module, action, status from common message keywords if omitted
        if (!module || !action) {
            const lowerMsg = message.toLowerCase();
            let detectedModule = "Application";
            let detectedAction = "Execute";
            let detectedStatus = level === "ERROR" || level === "FATAL" ? "FAILED" : "SUCCESS";

            if (lowerMsg.includes("csv parsing stage started")) {
                detectedModule = "CSV Parser";
                detectedAction = "Parse CSV";
                detectedStatus = "PENDING";
            } else if (lowerMsg.includes("csv parsing stage completed")) {
                detectedModule = "CSV Parser";
                detectedAction = "Parse CSV";
                detectedStatus = "SUCCESS";
            } else if (lowerMsg.includes("batch created")) {
                detectedModule = "Batcher";
                detectedAction = "Create Batch";
                detectedStatus = "SUCCESS";
            } else if (lowerMsg.includes("batch processing started")) {
                detectedModule = "Batcher";
                detectedAction = "Process Batch";
                detectedStatus = "PENDING";
            } else if (lowerMsg.includes("building prompt")) {
                detectedModule = "Prompt Builder";
                detectedAction = "Build Prompt";
                detectedStatus = "SUCCESS";
            } else if (lowerMsg.includes("ai request started")) {
                detectedModule = "AI Provider";
                detectedAction = "Generate AI Mapping";
                detectedStatus = "PENDING";
            } else if (lowerMsg.includes("ai request completed")) {
                detectedModule = "AI Provider";
                detectedAction = "Generate AI Mapping";
                detectedStatus = "SUCCESS";
            } else if (lowerMsg.includes("validation started")) {
                detectedModule = "Validator";
                detectedAction = "Validate Response";
                detectedStatus = "PENDING";
            } else if (lowerMsg.includes("validation completed")) {
                detectedModule = "Validator";
                detectedAction = "Validate Response";
                detectedStatus = "SUCCESS";
            } else if (lowerMsg.includes("server is running") || lowerMsg.includes("running on port")) {
                detectedModule = "System";
                detectedAction = "Server Start";
                detectedStatus = "SUCCESS";
            }

            if (!module) module = detectedModule;
            if (!action) action = detectedAction;
            if (!status) status = detectedStatus;
        }

        // Handle error and stack serialization
        let errorStr: string | undefined = undefined;
        let stackStr: string | undefined = undefined;

        if (errorObj) {
            if (errorObj instanceof Error) {
                errorStr = errorObj.message;
                stackStr = errorObj.stack;
            } else if (typeof errorObj === "object") {
                try {
                    errorStr = JSON.stringify(errorObj);
                } catch {
                    errorStr = String(errorObj);
                }
            } else {
                errorStr = String(errorObj);
            }
        }

        return {
            timestamp,
            requestId,
            level,
            module,
            action,
            status,
            message,
            error: errorStr,
            stack: stackStr,
        };
    }

    private static shouldLog(level: LogLevel): boolean {
        if ((level === "DEBUG" || level === "TRACE") && !env.ENABLE_DEBUG_LOGS) {
            return false;
        }
        return true;
    }

    static logMessage(level: LogLevel, arg1: string | LogContext, arg2?: LogContext): void {
        if (!this.shouldLog(level)) return;

        const entry = this.parseArgs(level, arg1, arg2);

        if (env.ENABLE_CONSOLE_LOGS) {
            ConsoleLogger.log(entry);
        }

        if (env.ENABLE_FILE_LOGS) {
            FileLogger.log(entry);
        }
    }

    info(arg1: string | LogContext, arg2?: LogContext): void {
        Logger.logMessage(LogLevels.INFO, arg1, arg2);
    }

    success(arg1: string | LogContext, arg2?: LogContext): void {
        Logger.logMessage(LogLevels.SUCCESS, arg1, arg2);
    }

    warning(arg1: string | LogContext, arg2?: LogContext): void {
        Logger.logMessage(LogLevels.WARNING, arg1, arg2);
    }

    warn(arg1: string | LogContext, arg2?: LogContext): void {
        Logger.logMessage(LogLevels.WARNING, arg1, arg2);
    }

    error(arg1: string | LogContext, arg2?: any, arg3?: Record<string, unknown>): void {
        if (typeof arg1 === "string" && (arg2 instanceof Error || arg2 === undefined || arg2 === null)) {
            const context: LogContext = { ...arg3, error: arg2 };
            Logger.logMessage(LogLevels.ERROR, arg1, context);
        } else {
            Logger.logMessage(LogLevels.ERROR, arg1, arg2);
        }
    }

    debug(arg1: string | LogContext, arg2?: LogContext): void {
        Logger.logMessage(LogLevels.DEBUG, arg1, arg2);
    }

    trace(arg1: string | LogContext, arg2?: LogContext): void {
        Logger.logMessage(LogLevels.TRACE, arg1, arg2);
    }

    fatal(arg1: string | LogContext, arg2?: LogContext): void {
        Logger.logMessage(LogLevels.FATAL, arg1, arg2);
    }
}

export const logger = new Logger();
export default logger;