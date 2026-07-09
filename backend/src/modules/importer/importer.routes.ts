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

export default router;