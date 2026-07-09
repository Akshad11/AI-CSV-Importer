import { RetryOptions, DEFAULT_RETRY_OPTIONS } from "./RetryOptions";
import { RetryExecutor } from "./RetryExecutor";
import { CircuitBreaker } from "./CircuitBreaker";
import { EventBus } from "../events/EventBus";
import { ILogger } from "../interfaces/ILogger";
import { CancellationToken } from "../cancellation/CancellationToken";
import { RetryPolicy } from "./RetryPolicy";

export class RetryEngine {
    public static inject = ["config", "eventBus", "logger"];

    private readonly defaultOptions: RetryOptions;
    private readonly circuitBreakers: Map<string, CircuitBreaker> = new Map();

    constructor(
        config?: any,
        private readonly eventBus?: EventBus,
        private readonly logger?: ILogger
    ) {
        // Hydrate configuration overrides from env parameters
        const envAttempts = process.env.RETRY_MAX_ATTEMPTS
            ? parseInt(process.env.RETRY_MAX_ATTEMPTS, 10)
            : undefined;
        const envInitialDelay = process.env.RETRY_INITIAL_DELAY
            ? parseInt(process.env.RETRY_INITIAL_DELAY, 10)
            : undefined;
        const envMaxDelay = process.env.RETRY_MAX_DELAY
            ? parseInt(process.env.RETRY_MAX_DELAY, 10)
            : undefined;
        const envMultiplier = process.env.RETRY_MULTIPLIER
            ? parseFloat(process.env.RETRY_MULTIPLIER)
            : undefined;
        const envJitter = process.env.RETRY_JITTER as any;
        const envTimeout = process.env.RETRY_TIMEOUT
            ? parseInt(process.env.RETRY_TIMEOUT, 10)
            : undefined;

        this.defaultOptions = {
            maxAttempts: envAttempts ?? config?.maxAttempts ?? DEFAULT_RETRY_OPTIONS.maxAttempts,
            initialDelayMs: envInitialDelay ?? config?.initialDelayMs ?? DEFAULT_RETRY_OPTIONS.initialDelayMs,
            maxDelayMs: envMaxDelay ?? config?.maxDelayMs ?? DEFAULT_RETRY_OPTIONS.maxDelayMs,
            multiplier: envMultiplier ?? config?.multiplier ?? DEFAULT_RETRY_OPTIONS.multiplier,
            jitter: envJitter ?? config?.jitter ?? DEFAULT_RETRY_OPTIONS.jitter,
            delayStrategy: config?.delayStrategy ?? DEFAULT_RETRY_OPTIONS.delayStrategy,
            timeoutMs: envTimeout ?? config?.timeoutMs ?? DEFAULT_RETRY_OPTIONS.timeoutMs
        };
    }

    /**
     * Executes the operations inside a managed retry executor wrapper.
     */
    public async execute<T>(
        operation: () => Promise<T>,
        optionsOrPolicy?: Partial<RetryOptions> | string,
        cancellationToken?: CancellationToken,
        operationName: string = "default"
    ): Promise<T> {
        const mergedOptions = this.resolveOptions(optionsOrPolicy);

        // Lazily retrieve or allocate shared circuit breaker states by operationName
        let breaker = this.circuitBreakers.get(operationName);
        if (!breaker) {
            breaker = new CircuitBreaker(5, mergedOptions.initialDelayMs * 15, this.eventBus, operationName);
            this.circuitBreakers.set(operationName, breaker);
        }

        const executor = new RetryExecutor(
            mergedOptions,
            breaker,
            this.eventBus,
            this.logger,
            cancellationToken,
            operationName
        );

        const result = await executor.execute(operation);

        if (result.success) {
            return result.data as T;
        } else {
            throw result.error || new Error(`Retry engine execution failed for operation [${operationName}]`);
        }
    }

    /**
     * Retrieves the circuit breaker matching the operation name.
     */
    public getCircuitBreaker(operationName: string): CircuitBreaker | undefined {
        return this.circuitBreakers.get(operationName);
    }

    /**
     * Translates string policies or configurations into fully formed options.
     */
    private resolveOptions(optionsOrPolicy?: Partial<RetryOptions> | string): RetryOptions {
        if (!optionsOrPolicy) {
            return this.defaultOptions;
        }

        if (typeof optionsOrPolicy === "string") {
            switch (optionsOrPolicy.toLowerCase()) {
                case "ai":
                case "aiprovider":
                    return RetryPolicy.aiProvider();
                case "http":
                    return RetryPolicy.http();
                case "database":
                case "db":
                    return RetryPolicy.database();
                case "queue":
                    return RetryPolicy.queue();
                case "storage":
                    return RetryPolicy.storage();
                case "filesystem":
                case "fs":
                    return RetryPolicy.filesystem();
                default:
                    return this.defaultOptions;
            }
        }

        return {
            ...this.defaultOptions,
            ...optionsOrPolicy
        };
    }
}
