import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env";
import { LogLevel } from "./LogLevels";

export class FileLogger {
    private static writeQueue: string[] = [];
    private static isProcessing = false;
    private static isInitialized = false;

    private static getPaths() {
        const logDir = path.resolve(env.LOG_DIRECTORY);
        const logFile = path.resolve(logDir, env.LOG_FILE);
        return { logDir, logFile };
    }

    private static async ensureInitialized(): Promise<void> {
        if (this.isInitialized) return;

        const { logDir, logFile } = this.getPaths();
        try {
            await fs.mkdir(logDir, { recursive: true });
            
            // Check if file exists, if not create empty file
            try {
                await fs.access(logFile);
            } catch {
                await fs.writeFile(logFile, "", "utf-8");
            }

            this.isInitialized = true;
        } catch (err) {
            // Fallback console warning if logging initialization fails
            process.stderr.write(`Failed to initialize FileLogger: ${String(err)}\n`);
        }
    }

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
        let logBlock = "------------------------------------------------------------\n";
        logBlock += `[${entry.timestamp}]\n`;
        logBlock += `REQUEST_ID: ${entry.requestId}\n`;
        logBlock += `LEVEL: ${entry.level}\n`;
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
        logBlock += "------------------------------------------------------------\n";

        this.writeQueue.push(logBlock);
        this.processQueue();
    }

    private static async processQueue(): Promise<void> {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            await this.ensureInitialized();

            const { logFile } = this.getPaths();

            while (this.writeQueue.length > 0) {
                const chunk = this.writeQueue.shift();
                if (!chunk) continue;

                // Check size and rotate if needed before appending
                await this.checkAndRotate();

                await fs.appendFile(logFile, chunk, "utf-8");
            }
        } catch (err) {
            process.stderr.write(`Failed to write logs to file: ${String(err)}\n`);
        } finally {
            this.isProcessing = false;
        }
    }

    private static async checkAndRotate(): Promise<void> {
        const { logDir, logFile } = this.getPaths();
        try {
            const stats = await fs.stat(logFile);
            if (stats.size >= env.MAX_LOG_SIZE) {
                const now = new Date();
                const pad = (n: number) => String(n).padStart(2, "0");
                const timestampStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}`;
                
                // Form rotated filename, e.g. log-2026-07-11-15-22.txt
                const ext = path.extname(env.LOG_FILE);
                const base = path.basename(env.LOG_FILE, ext);
                const rotatedFile = path.resolve(logDir, `${base}-${timestampStr}${ext}`);

                // Rename current log file
                await fs.rename(logFile, rotatedFile);
                
                // Create a new blank log file
                await fs.writeFile(logFile, "", "utf-8");
            }
        } catch {
            // Ignore rotation errors to avoid crashing app
        }
    }
}
