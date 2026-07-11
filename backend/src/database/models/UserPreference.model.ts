import mongoose, { Schema, Document } from "mongoose";

export interface IUserPreference {
    theme: "light" | "dark" | "system";
    rowsPerPage: number;
    preferredAiProvider: string;
    preferredModel: string;
    previewRows: number;
    defaultView?: string;
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserPreferenceDocument extends IUserPreference, Document {}

const UserPreferenceSchema = new Schema<IUserPreferenceDocument>(
    {
        theme: { type: String, required: true, enum: ["light", "dark", "system"], default: "system" },
        rowsPerPage: { type: Number, required: true, default: 25 },
        preferredAiProvider: { type: String, required: true, default: "openai" },
        preferredModel: { type: String, required: true, default: "gpt-4o-mini" },
        previewRows: { type: Number, required: true, default: 10 },
        defaultView: { type: String, default: "history" },
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date }
    },
    {
        timestamps: true
    }
);

export const UserPreferenceModel = mongoose.model<IUserPreferenceDocument>("UserPreference", UserPreferenceSchema, "UserPreferences");
