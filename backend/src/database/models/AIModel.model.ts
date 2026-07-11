import mongoose, { Schema, Document } from "mongoose";

export interface IAIModelData {
    provider: string;
    modelName: string;
    displayName: string;
    maxTokens: number;
    temperature: number;
    enabled: boolean;
    default: boolean;
    supportsJson: boolean;
    supportsFunctionCalling: boolean;
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IAIModelDocument extends IAIModelData, Document {}

const AIModelSchema = new Schema<IAIModelDocument>(
    {
        provider: { type: String, required: true, index: true },
        modelName: { type: String, required: true },
        displayName: { type: String, required: true },
        maxTokens: { type: Number, required: true, default: 4096 },
        temperature: { type: Number, required: true, default: 0.2 },
        enabled: { type: Boolean, required: true, default: true, index: true },
        default: { type: Boolean, required: true, default: false },
        supportsJson: { type: Boolean, required: true, default: true },
        supportsFunctionCalling: { type: Boolean, required: true, default: false },
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date }
    },
    {
        timestamps: true
    }
);

// Create compound index for unique models per provider
AIModelSchema.index({ provider: 1, modelName: 1 }, { unique: true });

export const AIModelModel = mongoose.model<IAIModelDocument>("AIModel", AIModelSchema, "AIModels");
