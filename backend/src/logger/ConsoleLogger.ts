import { LogColors, LogLevel } from "./LogLevels";

export class ConsoleLogger {
    static log(entry: {
        timestamp: string;
        requestId: string;
        level: LogLevel;
        module: string;
        action: string;
        status: string;
        message: string;
        error?: string;
        stack?: string;
    }): void {
        const color = LogColors[entry.level] || LogColors.RESET;
        const reset = LogColors.RESET;

        let logBlock = "------------------------------------------------------------\n";
        logBlock += `[${entry.timestamp}]\n`;
        logBlock += `REQUEST_ID: ${entry.requestId}\n`;
        logBlock += `LEVEL: ${color}${entry.level}${reset}\n`;
        logBlock += `MODULE: ${entry.module}\n`;
        logBlock += `ACTION: ${entry.action}\n`;
        logBlock += `STATUS: ${entry.status}\n`;
        logBlock += `MESSAGE: ${entry.message}\n`;

        if (entry.error) {
            logBlock += `ERROR:\n${entry.error}\n`;
        }
        if (entry.stack) {
            logBlock += `STACK:\n${entry.stack}\n`;
        }
        logBlock += "------------------------------------------------------------";

        if (entry.level === "ERROR" || entry.level === "FATAL") {
            process.stderr.write(logBlock + "\n");
        } else {
            process.stdout.write(logBlock + "\n");
        }
    }
}
