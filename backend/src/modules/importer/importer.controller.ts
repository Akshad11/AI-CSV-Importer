import { Request, Response } from "express";
import { importerService } from "./importer.service";
import { ApiResponse } from "../../responses/apiResponse";
import { AppError } from "../../errors/AppError";
import { logger } from "../../logger/logger";

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

    async process(req: Request, res: Response) {
        if (!req.file) {
            throw new AppError(
                "CSV file is required.",
                400,
                "CSV_FILE_REQUIRED"
            );
        }

        const provider = req.body.provider || "openai";
        const model = req.body.model || "gpt-4o-mini";
        const batchSize = parseInt(req.body.batchSize || "25", 10);
        
        let columnMappings: Record<string, string> = {};
        if (req.body.columnMappings) {
            try {
                columnMappings = typeof req.body.columnMappings === "string" 
                    ? JSON.parse(req.body.columnMappings)
                    : req.body.columnMappings;
            } catch (err) {
                throw new AppError(
                    "Invalid columnMappings JSON format.",
                    400,
                    "INVALID_COLUMN_MAPPINGS"
                );
            }
        }

        const confidenceThreshold = parseFloat(req.body.confidenceThreshold || "85");
        const defaultLeadSource = req.body.defaultLeadSource || "Organic Search";

        const result = await importerService.process({
            filePath: req.file.path,
            originalFileName: req.file.originalname,
            provider,
            model,
            batchSize,
            columnMappings,
            confidenceThreshold,
            defaultLeadSource,
        });

        return ApiResponse.success(
            res,
            "CSV processed with AI pipeline successfully.",
            result
        );
    }

    async logClientError(req: Request, res: Response) {
        const { requestId, error, status } = req.body;
        logger.error({
            requestId: requestId || req.requestId || "n/a",
            module: "Frontend",
            action: "Client Error Telemetry",
            status: "FAILED",
            message: `Frontend error (HTTP status: ${status || "unknown"}). Detail: ${typeof error === "object" ? JSON.stringify(error) : String(error)}`,
            error: error
        });
        return ApiResponse.success(res, "Client error logged successfully.");
    }
}

export const importerController =
    new ImporterController();