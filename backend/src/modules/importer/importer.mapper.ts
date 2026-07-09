import { ImportStatusResponse } from "./importer.types";

export const toImportStatusResponse = (
    message: string
): ImportStatusResponse => ({
    status: "ready",
    message,
});