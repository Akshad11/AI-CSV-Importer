import mongoose, { Schema, Document } from "mongoose";

export interface IAIProviderData {
    providerName: string;
    enabled: boolean;
    priority: number;
    apiKeyReference?: string;
    endpoint?: string;
    defaultModel: string;
    rateLimits?: {
        requestsPerMinute?: number;
        tokensPerMinute?: number;
    };
    retryPolicy?: {
        maxAttempts?: number;
        initialDelayMs?: number;
    };
    timeout?: number;
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IAIProviderDocument extends IAIProviderData, Document {}

const AIProviderSchema = new Schema<IAIProviderDocument>(
    {
        providerName: { type: String, required: true, unique: true, index: true },
        enabled: { type: Boolean, required: true, default: true, index: true },
        priority: { type: Number, required: true, default: 0 },
        apiKeyReference: { type: String },
        endpoint: { type: String },
        defaultModel: { type: String, required: true },
        rateLimits: {
            requestsPerMinute: { type: Number },
            tokensPerMinute: { type: Number }
        },
        retryPolicy: {
            maxAttempts: { type: Number },
            initialDelayMs: { type: Number }
        },
        timeout: { type: Number },
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date }
    },
    {
        timestamps: true
    }
);

export const AIProviderModel = mongoose.model<IAIProviderDocument>("AIProvider", AIProviderSchema, "AIProviders");
