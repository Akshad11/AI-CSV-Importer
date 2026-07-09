import { AIProviderError } from "./AIProviderError";

export class RateLimitError extends AIProviderError {
    public override name = "RateLimitError";
    
    constructor(
        message: string,
        provider: string,
        model: string,
        public readonly retryAfterSeconds?: number,
        originalError?: Error
    ) {
        super(message, provider, model, originalError);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
