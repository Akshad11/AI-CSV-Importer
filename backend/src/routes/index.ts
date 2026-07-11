import { Router } from "express";
import healthRoutes from "./health.routes";
import { importerRoutes, importerController } from "../modules/importer";

const router = Router();

router.use("/", healthRoutes);

router.use("/api/v1/importer", importerRoutes);
router.post("/api/v1/ai/test", importerController.testAiConnection.bind(importerController));

export default router;