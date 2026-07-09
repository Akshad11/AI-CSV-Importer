import { ImportContext, ImportContextOptions } from "../../src/core/pipeline/ImportContext";
import { CancellationToken } from "../../src/core/cancellation/CancellationToken";
import { EventBus } from "../../src/core/events/EventBus";

export class ImportContextBuilder {
    private options: Partial<ImportContextOptions> = {
        importId: "import-default",
        requestId: "req-default",
        provider: "mock",
        model: "default-model",
        batchSize: 50,
        filePath: "dummy.csv",
        originalFileName: "dummy.csv",
        logger: { info: () => {}, warn: () => {}, error: () => {} } as any,
        eventBus: new EventBus(),
        cancellationToken: new CancellationToken(),
        config: {},
        metadata: {}
    };

    public withImportId(importId: string): this {
        this.options.importId = importId;
        return this;
    }

    public withProvider(provider: string): this {
        this.options.provider = provider;
        return this;
    }

    public withModel(model: string): this {
        this.options.model = model;
        return this;
    }

    public withBatchSize(batchSize: number): this {
        this.options.batchSize = batchSize;
        return this;
    }

    public build(): ImportContext {
        return new ImportContext(this.options as ImportContextOptions);
    }
}
