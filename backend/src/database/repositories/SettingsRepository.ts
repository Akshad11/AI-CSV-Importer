import { ApplicationSettingsModel, IApplicationSettingsDocument } from "../models/ApplicationSettings.model";

export class SettingsRepository {
    public async get(): Promise<IApplicationSettingsDocument> {
        const doc = await ApplicationSettingsModel.findOne({ isDeleted: { $ne: true } }).exec();
        if (doc) {
            return doc;
        }

        // Return a new initialized document (caller will save or bootstrap)
        return new ApplicationSettingsModel({
            defaultAiProvider: "gemini",
            defaultModel: "gemini-3.5-flash",
            batchSize: 25,
            maxCsvSize: 5242880,
            maxRetries: 3,
            timeout: 30000,
            enableLogging: true,
            enableDebug: false,
            theme: "system"
        });
    }

    public async update(updateData: Partial<IApplicationSettingsDocument>): Promise<IApplicationSettingsDocument> {
        let doc = await ApplicationSettingsModel.findOne({ isDeleted: { $ne: true } }).exec();
        if (doc) {
            Object.assign(doc, updateData);
            return doc.save();
        }

        const newDoc = new ApplicationSettingsModel({
            ...updateData
        });
        return newDoc.save();
    }
}
