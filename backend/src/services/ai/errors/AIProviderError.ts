export class AIProviderError extends Error {
    public override name: string = "AIProviderError";
    
    constructor(
        message: string,
        public readonly provider: string,
        public readonly model: string,
        public readonly originalError?: Error
    ) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
