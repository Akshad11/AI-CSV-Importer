import { AIProviderError } from "./AIProviderError";

export class RetryLimitExceededError extends AIProviderError {
    public override name = "RetryLimitExceededError";
    
    constructor(
        message: string,
        provider: string,
        model: string,
        public readonly attempts: number,
        originalError?: Error
    ) {
        super(message, provider, model, originalError);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
