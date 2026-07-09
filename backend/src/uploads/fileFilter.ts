import multer from "multer";
import path from "node:path";
import { AppError } from "../errors/AppError";
import { UploadConstants } from "./upload.constants";

export const fileFilter: multer.Options["fileFilter"] = (
    _req,
    file,
    callback
) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (
        !UploadConstants.ALLOWED_EXTENSIONS.includes(extension)
    ) {
        return callback(
            new AppError(
                "Only CSV files are allowed.",
                400,
                "INVALID_FILE_EXTENSION"
            )
        );
    }

    if (
        !UploadConstants.ALLOWED_MIME_TYPES.includes(file.mimetype)
    ) {
        return callback(
            new AppError(
                "Invalid file type.",
                400,
                "INVALID_FILE_TYPE"
            )
        );
    }

    callback(null, true);
};