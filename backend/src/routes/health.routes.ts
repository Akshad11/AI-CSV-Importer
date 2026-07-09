import { Router } from "express";
import { APP_NAME, APP_VERSION } from "../constants/app";

const router = Router();

router.get("/health", (_req, res) => {
    res.json({
        success: true,
        status: "healthy",
        service: APP_NAME,
        version: APP_VERSION,
        timestamp: new Date().toISOString(),
    });
});

router.get("/ready", (_req, res) => {
    res.json({
        success: true,
        ready: true,
    });
});

router.get("/version", (_req, res) => {
    res.json({
        success: true,
        version: APP_VERSION,
    });
});

export default router;