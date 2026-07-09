import { Router } from "express";
import healthRoutes from "./health.routes";
import { importerRoutes } from "../modules/importer";

const router = Router();

router.use("/", healthRoutes);

router.use("/api/v1/importer", importerRoutes);

export default router;