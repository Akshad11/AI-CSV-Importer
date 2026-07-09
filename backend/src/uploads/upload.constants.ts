export const UploadConstants = {
    DIRECTORY: "uploads",

    MAX_FILE_SIZE: 5 * 1024 * 1024,

    ALLOWED_EXTENSIONS: [".csv"],

    ALLOWED_MIME_TYPES: [
        "text/csv",
        "application/vnd.ms-excel"
    ]
};