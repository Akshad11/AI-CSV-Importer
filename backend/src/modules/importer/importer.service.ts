import { csvParserService } from "../../services/csv/csvParser.service";

export class ImporterService {
    getStatus() {
        return {
            status: "ready",
            message: "Importer module is initialized.",
        };
    }

    async parseCsv(filePath: string) {
        return csvParserService.stream(filePath);
    }
}

export const importerService = new ImporterService();