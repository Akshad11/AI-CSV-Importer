import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { UploadConstants } from "./upload.constants";
import { fileFilter } from "./fileFilter";

const storage = multer.diskStorage({
    destination(_req, _file, callback) {
        callback(null, UploadConstants.DIRECTORY);
    },

    filename(_req, file, callback) {
        const extension = path.extname(file.originalname);

        callback(
            null,
            `${randomUUID()}${extension}`
        );
    }
});

export const upload = multer({
    storage,

    fileFilter,

    limits: {
        fileSize: UploadConstants.MAX_FILE_SIZE
    }
});