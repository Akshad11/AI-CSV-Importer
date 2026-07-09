import { EventBus } from "../../src/core/events/EventBus";

export class MockEventBus extends EventBus {
    public readonly publishedEvents: { event: string; payload: any }[] = [];

    /**
     * Publishes and logs the event for later test assertions.
     */
    public override publish(event: any, payload: any): void {
        this.publishedEvents.push({ event, payload });
        super.publish(event, payload);
    }

    public clearLogs(): void {
        this.publishedEvents.length = 0;
    }
}
