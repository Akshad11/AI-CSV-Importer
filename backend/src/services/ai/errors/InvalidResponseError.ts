import { AIProviderError } from "./AIProviderError";

export class InvalidResponseError extends AIProviderError {
    public override name = "InvalidResponseError";
    
    constructor(
        message: string,
        provider: string,
        model: string,
        public readonly rawResponse?: string,
        originalError?: Error
    ) {
        super(message, provider, model, originalError);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
