import { describe, expect, it } from "vitest";
import { batchService } from "../../../src/services/batch/batch.service";
import { CsvRow } from "../../../src/services/csv/csv.types";

describe("Batch Service", () => {
    async function* createRows(): AsyncGenerator<CsvRow> {
        for (let i = 1; i <= 5; i++) {
            yield {
                Name: `User ${i}`,
                Email: `user${i}@example.com`,
            };
        }
    }

    it("creates batches correctly", async () => {
        const batches = [];

        for await (const batch of batchService.create(createRows(), 2)) {
            batches.push(batch);
        }

        expect(batches.length).toBe(3);

        expect(batches[0].rows.length).toBe(2);

        expect(batches[1].rows.length).toBe(2);

        expect(batches[2].rows.length).toBe(1);
    });
});