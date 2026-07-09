import { randomUUID } from "node:crypto";
import { CsvRow } from "../csv/csv.types";
import { CsvBatch } from "./batch.types";
import { DEFAULT_BATCH_SIZE } from "./batch.constants";

export class BatchService {
    async *create(
        rows: AsyncIterable<CsvRow>,
        batchSize = DEFAULT_BATCH_SIZE
    ): AsyncGenerator<CsvBatch> {
        let currentBatch: CsvRow[] = [];
        let batchNumber = 1;

        for await (const row of rows) {
            currentBatch.push(row);

            if (currentBatch.length >= batchSize) {
                yield {
                    id: randomUUID(),
                    batchNumber,
                    totalRows: currentBatch.length,
                    rows: currentBatch,
                };

                currentBatch = [];
                batchNumber++;
            }
        }

        if (currentBatch.length > 0) {
            yield {
                id: randomUUID(),
                batchNumber,
                totalRows: currentBatch.length,
                rows: currentBatch,
            };
        }
    }
}

export const batchService = new BatchService();