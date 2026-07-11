import mongoose, { Schema, Document } from "mongoose";

export interface IApplicationSettings {
    defaultAiProvider: string;
    defaultModel: string;
    batchSize: number;
    maxCsvSize: number;
    maxRetries: number;
    timeout: number;
    enableLogging: boolean;
    enableDebug: boolean;
    theme: "light" | "dark" | "system";
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IApplicationSettingsDocument extends IApplicationSettings, Document {}

const ApplicationSettingsSchema = new Schema<IApplicationSettingsDocument>(
    {
        defaultAiProvider: { type: String, required: true, default: "openai" },
        defaultModel: { type: String, required: true, default: "gpt-4o-mini" },
        batchSize: { type: Number, required: true, default: 25 },
        maxCsvSize: { type: Number, required: true, default: 5242880 },
        maxRetries: { type: Number, required: true, default: 3 },
        timeout: { type: Number, required: true, default: 30000 },
        enableLogging: { type: Boolean, required: true, default: true },
        enableDebug: { type: Boolean, required: true, default: false },
        theme: { type: String, required: true, enum: ["light", "dark", "system"], default: "system" },
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date }
    },
    {
        timestamps: true
    }
);

export const ApplicationSettingsModel = mongoose.model<IApplicationSettingsDocument>("ApplicationSettings", ApplicationSettingsSchema, "ApplicationSettings");
