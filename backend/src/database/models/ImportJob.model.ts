import mongoose, { Schema, Document } from "mongoose";

export interface IImportJob {
    importId: string;
    filename: string;
    originalFilename: string;
    fileSize: number;
    rows: number;
    columns: string[];
    status: "pending" | "parsing" | "processing" | "completed" | "failed";
    startedAt: Date;
    completedAt?: Date;
    duration?: number;
    aiProvider: string;
    aiModel: string;
    promptVersion: string;
    batchSize: number;
    totalImported: number;
    totalSkipped: number;
    successRate: number;
    createdBy?: string;
    metadata?: Record<string, any>;
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IImportJobDocument extends IImportJob, Document {}

const ImportJobSchema = new Schema<IImportJobDocument>(
    {
        importId: { type: String, required: true, unique: true, index: true },
        filename: { type: String, required: true },
        originalFilename: { type: String, required: true },
        fileSize: { type: Number, required: true },
        rows: { type: Number, required: true },
        columns: [{ type: String }],
        status: {
            type: String,
            required: true,
            enum: ["pending", "parsing", "processing", "completed", "failed"],
            default: "pending",
            index: true
        },
        startedAt: { type: Date, required: true, default: Date.now },
        completedAt: { type: Date },
        duration: { type: Number },
        aiProvider: { type: String, required: true },
        aiModel: { type: String, required: true },
        promptVersion: { type: String, required: true },
        batchSize: { type: Number, required: true },
        totalImported: { type: Number, default: 0 },
        totalSkipped: { type: Number, default: 0 },
        successRate: { type: Number, default: 0 },
        createdBy: { type: String },
        metadata: { type: Schema.Types.Mixed },
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date }
    },
    {
        timestamps: true
    }
);

// Indexes
ImportJobSchema.index({ createdAt: -1 });

export const ImportJobModel = mongoose.model<IImportJobDocument>("ImportJob", ImportJobSchema, "ImportJobs");
