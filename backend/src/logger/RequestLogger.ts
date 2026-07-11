import { Request, Response, NextFunction } from "express";
import { logger } from "./logger";
import { logLocalStorage } from "./LoggerService";

function maskSensitiveData(data: any): any {
    if (!data) return data;
    if (typeof data !== "object") return data;

    if (Array.isArray(data)) {
        return data.map(item => maskSensitiveData(item));
    }

    const masked = { ...data };
    const sensitiveKeys = [
        "password", "pass", "pwd", "token", "secret", "apikey", "api_key",
        "authorization", "cookie", "jwt", "key", "credential"
    ];

    for (const key of Object.keys(masked)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
            masked[key] = "********";
        } else if (typeof masked[key] === "object") {
            masked[key] = maskSensitiveData(masked[key]);
        }
    }
    return masked;
}

function maskHeaders(headers: Record<string, any>): Record<string, string> {
    const masked: Record<string, string> = {};
    const sensitiveHeaders = ["authorization", "cookie", "set-cookie", "x-api-key", "x-auth-token"];
    for (const [key, val] of Object.entries(headers)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveHeaders.includes(lowerKey)) {
            masked[key] = "********";
        } else {
            masked[key] = String(val);
        }
    }
    return masked;
}

export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const requestId = req.requestId || "n/a";

    // Bind log context
    logLocalStorage.run({ requestId }, () => {
        // Log request details
        logger.info(`Incoming request ${req.method} ${req.originalUrl}`, {
            module: "HTTP",
            action: "Request",
            status: "SUCCESS",
            ip: req.ip,
            userAgent: req.get("user-agent"),
            headers: maskHeaders(req.headers),
            body: maskSensitiveData(req.body)
        });

        // Intercept response finish
        res.on("finish", () => {
            const duration = Date.now() - start;
            const statusLabel = res.statusCode >= 400 ? "FAILED" : "SUCCESS";
            logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration} ms`, {
                module: "HTTP",
                action: "Response",
                status: statusLabel,
                durationMs: duration
            });
        });

        next();
    });
};
export default requestLoggerMiddleware;
