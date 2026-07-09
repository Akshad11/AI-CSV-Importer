import { Worker } from "./Worker";

export type SchedulingStrategy = "FIFO" | "Priority" | "RoundRobin";

export class Scheduler {
    private roundRobinIndex = 0;

    constructor(private readonly strategy: SchedulingStrategy = "FIFO") {}

    /**
     * Selects the next worker from the candidate pool using the configured scheduling strategy.
     */
    public selectWorker(
        availableWorkers: Worker[],
        strategyOverride?: SchedulingStrategy
    ): Worker | null {
        if (availableWorkers.length === 0) {
            return null;
        }

        const activeStrategy = strategyOverride || this.strategy;

        switch (activeStrategy) {
            case "RoundRobin":
                const index = this.roundRobinIndex % availableWorkers.length;
                this.roundRobinIndex = (index + 1) % availableWorkers.length;
                return availableWorkers[index];

            case "Priority":
            case "FIFO":
            default:
                // FIFO and Priority orders are managed natively in the Queue sorting logic,
                // so we safely return the first available worker.
                return availableWorkers[0];
        }
    }
}
