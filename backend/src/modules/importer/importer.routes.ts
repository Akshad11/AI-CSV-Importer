import { Router } from "express";
import { importerController } from "./importer.controller";
import { uploadCsv } from "../../uploads/upload.middleware";

const router = Router();

router.get(
    "/status",
    importerController.getStatus.bind(importerController)
);

router.post(
    "/upload",
    uploadCsv,
    importerController.upload.bind(importerController)
);

router.post(
    "/process",
    uploadCsv,
    importerController.process.bind(importerController)
);

router.post(
    "/client-error",
    importerController.logClientError.bind(importerController)
);

// Settings Routes
router.get("/settings", importerController.getSettings.bind(importerController));
router.put("/settings", importerController.updateSettings.bind(importerController));

// Providers Routes
router.get("/providers", importerController.getProviders.bind(importerController));
router.post("/providers", importerController.createProvider.bind(importerController));
router.put("/providers/:id", importerController.updateProvider.bind(importerController));
router.delete("/providers/:id", importerController.deleteProvider.bind(importerController));

// Models Routes
router.get("/models", importerController.getModels.bind(importerController));
router.post("/models", importerController.createModel.bind(importerController));
router.put("/models/:id", importerController.updateModel.bind(importerController));
router.delete("/models/:id", importerController.deleteModel.bind(importerController));

// Prompts Routes
router.get("/prompts", importerController.getPrompts.bind(importerController));
router.post("/prompts", importerController.createPrompt.bind(importerController));
router.put("/prompts/:id", importerController.updatePrompt.bind(importerController));
router.delete("/prompts/:id", importerController.deletePrompt.bind(importerController));

// Import History & Detail Query Routes
router.get("/imports", importerController.getImports.bind(importerController));
router.get("/imports/:id", importerController.getImportDetails.bind(importerController));
router.delete("/imports/:id", importerController.deleteImport.bind(importerController));
router.get("/imports/:id/records", importerController.getImportRecords.bind(importerController));
router.get("/imports/:id/skipped", importerController.getImportSkipped.bind(importerController));
router.get("/imports/:id/statistics", importerController.getImportStatistics.bind(importerController));
router.get("/imports/:id/logs", importerController.getImportLogs.bind(importerController));

export default router;