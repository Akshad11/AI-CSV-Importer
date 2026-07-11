export type LogLevel = "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "DEBUG" | "TRACE" | "FATAL";

export const LogLevels = {
    INFO: "INFO" as LogLevel,
    SUCCESS: "SUCCESS" as LogLevel,
    WARNING: "WARNING" as LogLevel,
    ERROR: "ERROR" as LogLevel,
    DEBUG: "DEBUG" as LogLevel,
    TRACE: "TRACE" as LogLevel,
    FATAL: "FATAL" as LogLevel,
} as const;

export const LogColors = {
    INFO: "\x1b[32m",       // Green
    SUCCESS: "\x1b[1m\x1b[32m", // Bold Green
    WARNING: "\x1b[33m",    // Yellow
    ERROR: "\x1b[31m",      // Red
    DEBUG: "\x1b[34m",      // Blue
    TRACE: "\x1b[90m",      // Gray
    FATAL: "\x1b[1m\x1b[31m", // Bold Red / Crimson
    RESET: "\x1b[0m",
} as const;
