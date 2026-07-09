export class OrchestratorError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly originalError?: Error
    ) {
        super(message);
        this.name = this.constructor.name;
        
        // Restore prototype chain
        Object.setPrototypeOf(this, new.target.prototype);
        
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export class ValidationError extends OrchestratorError {
    constructor(message: string, originalError?: Error) {
        super(message, "VALIDATION_ERROR", originalError);
    }
}

export class AIProviderError extends OrchestratorError {
    constructor(message: string, originalError?: Error) {
        super(message, "AI_PROVIDER_ERROR", originalError);
    }
}

export class JsonParsingError extends OrchestratorError {
    constructor(message: string, originalError?: Error) {
        super(message, "JSON_PARSING_ERROR", originalError);
    }
}

export class CsvParsingError extends OrchestratorError {
    constructor(message: string, originalError?: Error) {
        super(message, "CSV_PARSING_ERROR", originalError);
    }
}

export class UnexpectedOrchestratorError extends OrchestratorError {
    constructor(message: string, originalError?: Error) {
        super(message, "UNEXPECTED_ERROR", originalError);
    }
}
