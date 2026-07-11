import mongoose, { Schema, Document } from "mongoose";

export interface IPromptConfiguration {
    promptVersion: string;
    systemPrompt: string;
    userPrompt: string;
    description?: string;
    enabled: boolean;
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IPromptConfigurationDocument extends IPromptConfiguration, Document {}

const PromptConfigurationSchema = new Schema<IPromptConfigurationDocument>(
    {
        promptVersion: { type: String, required: true, unique: true, index: true },
        systemPrompt: { type: String, required: true },
        userPrompt: { type: String, required: true },
        description: { type: String },
        enabled: { type: Boolean, required: true, default: true, index: true },
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date }
    },
    {
        timestamps: true
    }
);

export const PromptConfigurationModel = mongoose.model<IPromptConfigurationDocument>("PromptConfiguration", PromptConfigurationSchema, "PromptConfigurations");
