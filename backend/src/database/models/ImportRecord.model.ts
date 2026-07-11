import mongoose, { Schema, Document } from "mongoose";

export interface IImportRecord {
    importId: string;
    originalRowNumber: number;
    name: string;
    email?: string;
    countryCode?: string;
    mobile?: string;
    company?: string;
    city?: string;
    state?: string;
    country?: string;
    leadOwner?: string;
    crmStatus?: string;
    crmNote?: string;
    dataSource?: string;
    possessionTime?: string;
    description?: string;
    aiConfidence: number;
    rawAiResponse?: string;
    mappedFields?: Record<string, any>;
    validationResult?: Record<string, any>;
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IImportRecordDocument extends IImportRecord, Document {}

const ImportRecordSchema = new Schema<IImportRecordDocument>(
    {
        importId: { type: String, required: true, index: true },
        originalRowNumber: { type: Number, required: true },
        name: { type: String, required: true },
        email: { type: String, index: true },
        countryCode: { type: String },
        mobile: { type: String, index: true },
        company: { type: String, index: true },
        city: { type: String },
        state: { type: String },
        country: { type: String },
        leadOwner: { type: String },
        crmStatus: { type: String, index: true },
        crmNote: { type: String },
        dataSource: { type: String },
        possessionTime: { type: String },
        description: { type: String },
        aiConfidence: { type: Number, required: true, default: 0 },
        rawAiResponse: { type: String },
        mappedFields: { type: Schema.Types.Mixed },
        validationResult: { type: Schema.Types.Mixed },
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date }
    },
    {
        timestamps: true
    }
);

export const ImportRecordModel = mongoose.model<IImportRecordDocument>("ImportRecord", ImportRecordSchema, "ImportRecords");
