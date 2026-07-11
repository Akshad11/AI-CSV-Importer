import { UserPreferenceModel, IUserPreferenceDocument } from "../models/UserPreference.model";

export class UserPreferenceRepository {
    public async get(): Promise<IUserPreferenceDocument> {
        const doc = await UserPreferenceModel.findOne({ isDeleted: { $ne: true } }).exec();
        if (doc) {
            return doc;
        }

        // Return new default instance
        return new UserPreferenceModel({
            theme: "system",
            rowsPerPage: 25,
            preferredAiProvider: "gemini",
            preferredModel: "gemini-3.5-flash",
            previewRows: 10,
            defaultView: "history"
        });
    }

    public async update(updateData: Partial<IUserPreferenceDocument>): Promise<IUserPreferenceDocument> {
        const doc = await UserPreferenceModel.findOne({ isDeleted: { $ne: true } }).exec();
        if (doc) {
            Object.assign(doc, updateData);
            return doc.save();
        }

        const newDoc = new UserPreferenceModel({
            ...updateData
        });
        return newDoc.save();
    }
}
