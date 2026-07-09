import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";

export const notFoundMiddleware = (
    _req: Request,
    _res: Response,
    next: NextFunction
) => {
    next(
        new AppError(
            "Route not found",
            404,
            "ROUTE_NOT_FOUND"
        )
    );
};