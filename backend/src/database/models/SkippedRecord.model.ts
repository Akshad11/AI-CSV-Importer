import mongoose, { Schema, Document } from "mongoose";

export interface ISkippedRecord {
    importId: string;
    originalRow: Record<string, any>;
    reason: string;
    validationErrors?: any[];
    aiResponse?: string;
    timestamp: Date;
    isDeleted: boolean;
    deletedAt?: Date;
}

export interface ISkippedRecordDocument extends ISkippedRecord, Document {}

const SkippedRecordSchema = new Schema<ISkippedRecordDocument>(
    {
        importId: { type: String, required: true, index: true },
        originalRow: { type: Schema.Types.Mixed, required: true },
        reason: { type: String, required: true },
        validationErrors: [{ type: Schema.Types.Mixed }],
        aiResponse: { type: String },
        timestamp: { type: Date, required: true, default: Date.now },
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date }
    },
    {
        timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
    }
);

export const SkippedRecordModel = mongoose.model<ISkippedRecordDocument>("SkippedRecord", SkippedRecordSchema, "SkippedRecords");
