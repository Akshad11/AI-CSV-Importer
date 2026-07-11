import mongoose, { Schema, Document } from "mongoose";

export interface IProcessingLog {
    importId: string;
    timestamp: Date;
    level: string;
    module: string;
    action: string;
    message: string;
    stackTrace?: string;
    requestId?: string;
    isDeleted: boolean;
    deletedAt?: Date;
}

export interface IProcessingLogDocument extends IProcessingLog, Document {}

const ProcessingLogSchema = new Schema<IProcessingLogDocument>(
    {
        importId: { type: String, required: true, index: true },
        timestamp: { type: Date, required: true, default: Date.now, index: true },
        level: { type: String, required: true },
        module: { type: String, required: true },
        action: { type: String, required: true },
        message: { type: String, required: true },
        stackTrace: { type: String },
        requestId: { type: String },
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date }
    },
    {
        timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
    }
);

// Indexes
ProcessingLogSchema.index({ importId: 1, timestamp: -1 });

export const ProcessingLogModel = mongoose.model<IProcessingLogDocument>("ProcessingLog", ProcessingLogSchema, "ProcessingLogs");
