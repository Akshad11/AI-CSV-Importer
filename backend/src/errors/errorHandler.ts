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
        module: "Express",
        action: "Request Error",
        status: "FAILED",
        message: err instanceof Error ? err.message : String(err),
        error: err,
    });

    // Translate raw AI provider errors to user-friendly structured responses
    if (
        err instanceof Error && 
        (err.name === "RateLimitError" || 
         err.name === "AIProviderError" || 
         (err as any).provider || 
         (err as any).message?.toLowerCase().includes("ai provider"))
    ) {
        const providerErr = err as any;
        const status = providerErr.status || providerErr.statusCode || providerErr.originalError?.status || 500;
        const msg = (providerErr.message || "").toLowerCase();

        let code = "AI_PROVIDER_ERROR";
        let statusCode = 500;
        let userMessage = "An error occurred while communicating with the AI provider.";
        let retryAfter: number | undefined = undefined;

        if (
            err.name === "RateLimitError" || 
            status === 429 || 
            msg.includes("quota") || 
            msg.includes("rate limit") || 
            msg.includes("429")
        ) {
            code = "AI_RATE_LIMIT";
            statusCode = 429;
            userMessage = "The AI provider has temporarily reached its request limit. Please try again in a few moments.";
            retryAfter = providerErr.retryAfterSeconds || 60;
        } else if (status === 401 || msg.includes("api key") || msg.includes("unauthorized") || msg.includes("401")) {
            code = "AI_AUTHENTICATION_ERROR";
            statusCode = 401;
            userMessage = "AI provider authentication failed. Please check the configured API key.";
        } else if (status === 403 || status === 404 || msg.includes("model not found") || msg.includes("404") || msg.includes("403")) {
            code = "AI_CONFIGURATION_ERROR";
            statusCode = 404;
            userMessage = "The requested AI model or endpoint is invalid or not found.";
        } else if (status === 408 || msg.includes("timeout") || msg.includes("timed out") || msg.includes("408")) {
            code = "AI_TIMEOUT";
            statusCode = 408;
            userMessage = "The request to the AI provider timed out. Please try again.";
        } else if (msg.includes("fetch failed") || msg.includes("network") || msg.includes("econnreset") || msg.includes("socket")) {
            code = "AI_NETWORK_FAILURE";
            statusCode = 503;
            userMessage = "A network connectivity issue occurred while communicating with the AI provider.";
        }

        return res.status(statusCode).json({
            success: false,
            code,
            message: userMessage,
            ...(retryAfter !== undefined ? { retryAfter } : {})
        });
    }

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