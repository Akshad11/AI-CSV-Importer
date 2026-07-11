import mongoose, { Schema, Document } from "mongoose";

export interface IImportStatistics {
    importId: string;
    rows: number;
    imported: number;
    skipped: number;
    warnings: number;
    errorCount: number;
    duration: number;
    averageBatchTime?: number;
    averageAiResponseTime?: number;
    estimatedCost: number;
    tokenUsage?: {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
    };
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IImportStatisticsDocument extends IImportStatistics, Document {}

const ImportStatisticsSchema = new Schema<IImportStatisticsDocument>(
    {
        importId: { type: String, required: true, unique: true, index: true },
        rows: { type: Number, required: true, default: 0 },
        imported: { type: Number, required: true, default: 0 },
        skipped: { type: Number, required: true, default: 0 },
        warnings: { type: Number, required: true, default: 0 },
        errorCount: { type: Number, required: true, default: 0 },
        duration: { type: Number, required: true, default: 0 },
        averageBatchTime: { type: Number },
        averageAiResponseTime: { type: Number },
        estimatedCost: { type: Number, required: true, default: 0 },
        tokenUsage: {
            promptTokens: { type: Number, default: 0 },
            completionTokens: { type: Number, default: 0 },
            totalTokens: { type: Number, default: 0 }
        },
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date }
    },
    {
        timestamps: true
    }
);

export const ImportStatisticsModel = mongoose.model<IImportStatisticsDocument>("ImportStatistics", ImportStatisticsSchema, "ImportStatistics");
