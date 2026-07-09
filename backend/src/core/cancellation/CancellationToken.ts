import { CancellationError } from "./CancellationError";

export class CancellationToken {
    private _isCancelled = false;
    private _reason?: string;
    private _timestamp?: Date;
    private callbacks: (() => void)[] = [];

    public get isCancelled(): boolean {
        return this._isCancelled;
    }

    public get reason(): string | undefined {
        return this._reason;
    }

    public get timestamp(): Date | undefined {
        return this._timestamp;
    }

    /**
     * Cancel the token and trigger all registered callbacks.
     */
    public cancel(reason: string = "Operation was cancelled"): void {
        if (this._isCancelled) {
            return;
        }

        this._isCancelled = true;
        this._reason = reason;
        this._timestamp = new Date();

        const executionCallbacks = [...this.callbacks];
        this.callbacks = [];

        for (const callback of executionCallbacks) {
            try {
                callback();
            } catch (error) {
                // Log the callback error but continue executing other callbacks to guarantee isolation
                console.error("Error executing cancellation callback:", error);
            }
        }
    }

    /**
     * Register a callback to be executed when cancellation is triggered.
     * If the token is already cancelled, the callback is executed immediately.
     * Returns an unsubscribe function.
     */
    public onCancelled(callback: () => void): () => void {
        if (this._isCancelled) {
            try {
                callback();
            } catch (error) {
                console.error("Error executing cancellation callback immediately:", error);
            }
            return () => {};
        }

        this.callbacks.push(callback);

        return () => {
            const index = this.callbacks.indexOf(callback);
            if (index !== -1) {
                this.callbacks.splice(index, 1);
            }
        };
    }

    /**
     * Throw a CancellationError if cancellation has been triggered.
     */
    public throwIfCancelled(): void {
        if (this._isCancelled) {
            throw new CancellationError(this._reason, this._timestamp);
        }
    }

    /**
     * Create a token that is already in a cancelled state.
     */
    public static cancelled(reason: string = "Operation was cancelled"): CancellationToken {
        const token = new CancellationToken();
        token.cancel(reason);
        return token;
    }

    /**
     * Create a token that will never be cancelled (None token).
     */
    public static get None(): CancellationToken {
        return new CancellationToken();
    }
}
