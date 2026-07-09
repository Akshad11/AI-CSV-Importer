import { Response } from "express";

export class ApiResponse {
    static success(
        res: Response,
        message: string,
        data: unknown = null,
        meta: unknown = {}
    ) {
        return res.json({
            success: true,
            message,
            data,
            meta,
        });
    }

    static error(
        res: Response,
        statusCode: number,
        message: string,
        code: string,
        errors: unknown = null
    ) {
        return res.status(statusCode).json({
            success: false,
            code,
            message,
            errors,
        });
    }
}