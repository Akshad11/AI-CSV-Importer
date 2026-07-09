import { EventTypeMap } from "./events";

export type EventHandler<T> = (payload: T) => void | Promise<void>;

interface Subscription {
    handler: EventHandler<any>;
    once: boolean;
}

export class EventBus {
    private listeners = new Map<string, Subscription[]>();

    /**
     * Subscribe to an event. Returns an unsubscribe function.
     */
    public subscribe<K extends keyof EventTypeMap>(
        eventName: K,
        handler: EventHandler<EventTypeMap[K]>
    ): () => void {
        const subs = this.listeners.get(eventName) || [];
        subs.push({ handler, once: false });
        this.listeners.set(eventName, subs);

        return () => {
            this.unsubscribe(eventName, handler);
        };
    }

    /**
     * Subscribe to an event and run the handler exactly once.
     */
    public once<K extends keyof EventTypeMap>(
        eventName: K,
        handler: EventHandler<EventTypeMap[K]>
    ): () => void {
        const subs = this.listeners.get(eventName) || [];
        subs.push({ handler, once: true });
        this.listeners.set(eventName, subs);

        return () => {
            this.unsubscribe(eventName, handler);
        };
    }

    /**
     * Unsubscribe a handler from an event.
     */
    public unsubscribe<K extends keyof EventTypeMap>(
        eventName: K,
        handler: EventHandler<EventTypeMap[K]>
    ): void {
        const subs = this.listeners.get(eventName);
        if (!subs) return;

        const filtered = subs.filter((sub) => sub.handler !== handler);
        if (filtered.length === 0) {
            this.listeners.delete(eventName);
        } else {
            this.listeners.set(eventName, filtered);
        }
    }

    /**
     * Publish an event asynchronously. Errors in listeners are isolated.
     */
    public async publish<K extends keyof EventTypeMap>(
        eventName: K,
        payload: EventTypeMap[K]
    ): Promise<void> {
        const subs = this.listeners.get(eventName);
        if (!subs || subs.length === 0) {
            return;
        }

        // Copy array in case handlers mutate subscriptions during execution
        const activeSubs = [...subs];

        // Trigger handlers in parallel
        const promises = activeSubs.map(async (sub) => {
            if (sub.once) {
                this.unsubscribe(eventName, sub.handler);
            }
            try {
                await sub.handler(payload);
            } catch (error) {
                // Enforce error isolation
                console.error(`[EventBus] Error executing handler for event "${eventName}":`, error);
            }
        });

        await Promise.all(promises);
    }

    /**
     * Clear all registered listeners.
     */
    public clear(): void {
        this.listeners.clear();
    }
}
