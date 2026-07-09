export class ParallelError extends Error {
    public name = "ParallelError";

    constructor(message: string, public readonly originalError?: Error) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export class WorkerExecutionError extends ParallelError {
    public override name = "WorkerExecutionError";

    constructor(
        message: string,
        public readonly workerId: string,
        public readonly batchIndex: number,
        originalError?: Error
    ) {
        super(message, originalError);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class ParallelCancelledError extends ParallelError {
    public override name = "ParallelCancelledError";

    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class QueueCapacityExceededError extends ParallelError {
    public override name = "QueueCapacityExceededError";

    constructor(message: string, public readonly currentSize: number, public readonly maxSize: number) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
