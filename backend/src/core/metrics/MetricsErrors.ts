export class MetricsError extends Error {
    public name = "MetricsError";

    constructor(message: string, public readonly originalError?: Error) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export class ReportGenerationError extends MetricsError {
    public override name = "ReportGenerationError";

    constructor(message: string, originalError?: Error) {
        super(message, originalError);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class CostCalculationError extends MetricsError {
    public override name = "CostCalculationError";

    constructor(message: string, originalError?: Error) {
        super(message, originalError);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class MetricsConfigurationError extends MetricsError {
    public override name = "MetricsConfigurationError";

    constructor(message: string, originalError?: Error) {
        super(message, originalError);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
