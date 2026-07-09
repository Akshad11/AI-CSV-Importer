import { EventBus } from "../events/EventBus";

export class BackpressureController {
    private isThrottled = false;

    constructor(
        private readonly eventBus?: EventBus,
        private readonly operationName = "default"
    ) {}

    /**
     * Flags intake throttle to true and broadcasts backpressure:enabled events.
     */
    public enableThrottling(): void {
        if (this.isThrottled) return;
        this.isThrottled = true;

        if (this.eventBus) {
            this.eventBus.publish("backpressure:enabled" as any, {
                operation: this.operationName,
                timestamp: new Date()
            });
        }
    }

    /**
     * Flags intake throttle to false and broadcasts backpressure:disabled events.
     */
    public disableThrottling(): void {
        if (!this.isThrottled) return;
        this.isThrottled = false;

        if (this.eventBus) {
            this.eventBus.publish("backpressure:disabled" as any, {
                operation: this.operationName,
                timestamp: new Date()
            });
        }
    }

    public shouldThrottle(): boolean {
        return this.isThrottled;
    }
}
