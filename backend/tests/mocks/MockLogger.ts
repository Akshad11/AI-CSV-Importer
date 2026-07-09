import { ILogger } from "../../src/core/interfaces/ILogger";

export class MockLogger implements ILogger {
    public readonly infoLogs: string[] = [];
    public readonly warnLogs: string[] = [];
    public readonly errorLogs: { message: string; error?: Error }[] = [];

    public debug(message: string, meta?: Record<string, unknown>): void {}

    public info(message: string, meta?: Record<string, unknown>): void {
        this.infoLogs.push(message);
    }

    public warn(message: string, meta?: Record<string, unknown>): void {
        this.warnLogs.push(message);
    }

    public error(message: string, error?: Error, meta?: Record<string, unknown>): void {
        this.errorLogs.push({ message, error });
    }
}
