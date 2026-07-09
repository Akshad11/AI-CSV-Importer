export class CancellationError extends Error {
    public readonly timestamp: Date;

    constructor(message: string = "Operation was cancelled", timestamp: Date = new Date()) {
        super(message);
        this.name = "CancellationError";
        this.timestamp = timestamp;

        // Restore prototype chain for custom errors in ES5/TS
        Object.setPrototypeOf(this, CancellationError.prototype);
    }
}
