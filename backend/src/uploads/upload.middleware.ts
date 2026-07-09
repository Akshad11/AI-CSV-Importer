import { upload } from "./multer.config";

export const uploadCsv = upload.single("file");