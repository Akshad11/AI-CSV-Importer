export class ConcurrencyController {
    private currentConcurrency: number;

    constructor(private readonly initialConcurrency: number) {
        this.currentConcurrency = initialConcurrency;
    }

    public getConcurrency(): number {
        return this.currentConcurrency;
    }

    public setConcurrency(limit: number): void {
        if (limit <= 0) {
            throw new Error("Concurrency limit must be greater than 0");
        }
        this.currentConcurrency = limit;
    }
}
