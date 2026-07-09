import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "./AppError";
import { ApiResponse } from "../responses/apiResponse";
import { logger } from "../logger/logger";

export const errorHandler = (
    err: unknown,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    logger.error({
        requestId: req.requestId,
        error: err,
    });

    if (err instanceof AppError) {
        return ApiResponse.error(
            res,
            err.statusCode,
            err.message,
            err.code
        );
    }

    if (err instanceof ZodError) {
        return ApiResponse.error(
            res,
            400,
            "Validation failed",
            "VALIDATION_ERROR",
            err.flatten()
        );
    }

    return ApiResponse.error(
        res,
        500,
        "Internal Server Error",
        "INTERNAL_SERVER_ERROR"
    );
};