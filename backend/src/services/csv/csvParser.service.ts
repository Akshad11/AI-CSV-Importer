import fs from "node:fs";
import csv from "csv-parser";
import { CsvRow } from "./csv.types";

export class CsvParserService {

    async *stream(filePath: string): AsyncGenerator<CsvRow> {

        const stream =
            fs.createReadStream(filePath)
                .pipe(csv());

        for await (const row of stream) {

            const normalized: CsvRow = {};

            for (const [key, value] of Object.entries(row)) {

                normalized[key.trim()] =
                    String(value).trim();

            }

            const hasValues =
                Object.values(normalized)
                    .some(v => v !== "");

            if (!hasValues)
                continue;

            yield normalized;

        }

    }

}

export const csvParserService =
    new CsvParserService();