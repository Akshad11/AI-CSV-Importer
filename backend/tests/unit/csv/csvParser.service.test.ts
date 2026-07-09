import { describe, expect, it } from "vitest";
import path from "node:path";
import { csvParserService } from "../../../src/services/csv/csvParser.service";

describe("CSV Parser", () => {

    it("streams every row", async () => {

        const file =
            path.resolve(
                "tests/fixtures/customers.csv"
            );

        const rows = [];

        for await (const row of csvParserService.stream(file)) {

            rows.push(row);

        }

        expect(rows.length).toBe(3);

        expect(rows[0].Name)
            .toBe("John Doe");

        expect(rows[2].Company)
            .toBe("OpenAI");

    });

});