export class RetryError extends Error {
    public name = "RetryError";
    
    constructor(message: string, public readonly originalError?: Error) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export class RetryExhaustedError extends RetryError {
    public override name = "RetryExhaustedError";
    
    constructor(
        message: string,
        public readonly attempts: number,
        originalError?: Error
    ) {
        super(message, originalError);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class RetryTimeoutError extends RetryError {
    public override name = "RetryTimeoutError";
    
    constructor(
        message: string,
        public readonly elapsedMs: number,
        originalError?: Error
    ) {
        super(message, originalError);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class CircuitBreakerOpenError extends RetryError {
    public override name = "CircuitBreakerOpenError";
    
    constructor(
        message: string,
        public readonly state: string,
        public readonly failureCount: number,
        public readonly recoveryTimeoutMs: number
    ) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class RetryCancelledError extends RetryError {
    public override name = "RetryCancelledError";
    
    constructor(message: string, originalError?: Error) {
        super(message, originalError);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
