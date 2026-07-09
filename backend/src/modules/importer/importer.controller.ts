import { Request, Response } from "express";
import { importerService } from "./importer.service";
import { ApiResponse } from "../../responses/apiResponse";
import { AppError } from "../../errors/AppError";

export class ImporterController {
    async getStatus(_req: Request, res: Response) {
        const result = importerService.getStatus();

        return ApiResponse.success(
            res,
            "Importer status fetched successfully.",
            result
        );
    }

    async upload(req: Request, res: Response) {
        if (!req.file) {
            throw new AppError(
                "CSV file is required.",
                400,
                "CSV_FILE_REQUIRED"
            );
        }

        const result = await importerService.parseCsv(req.file.path);

        return ApiResponse.success(
            res,
            "CSV parsed successfully.",
            result
        );
    }
}

export const importerController =
    new ImporterController();