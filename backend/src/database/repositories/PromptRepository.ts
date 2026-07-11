import { PromptConfigurationModel, IPromptConfigurationDocument } from "../models/PromptConfiguration.model";

export class PromptRepository {
    public async create(data: Partial<IPromptConfigurationDocument>): Promise<IPromptConfigurationDocument> {
        return PromptConfigurationModel.create(data);
    }

    public async findById(id: string): Promise<IPromptConfigurationDocument | null> {
        return PromptConfigurationModel.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
    }

    public async findByVersion(promptVersion: string): Promise<IPromptConfigurationDocument | null> {
        return PromptConfigurationModel.findOne({ promptVersion, isDeleted: { $ne: true } }).exec();
    }

    public async update(id: string, updateData: Partial<IPromptConfigurationDocument>): Promise<IPromptConfigurationDocument | null> {
        return PromptConfigurationModel.findOneAndUpdate(
            { _id: id, isDeleted: { $ne: true } },
            updateData,
            { returnDocument: "after" }
        ).exec();
    }

    public async delete(id: string): Promise<boolean> {
        const result = await PromptConfigurationModel.findOneAndUpdate(
            { _id: id, isDeleted: { $ne: true } },
            { isDeleted: true, deletedAt: new Date() }
        ).exec();
        return !!result;
    }

    public async list(filters: { enabled?: boolean } = {}): Promise<IPromptConfigurationDocument[]> {
        const query: any = { isDeleted: { $ne: true } };
        if (filters.enabled !== undefined) {
            query.enabled = filters.enabled;
        }
        return PromptConfigurationModel.find(query).sort({ promptVersion: -1 }).exec();
    }

    public async getActive(): Promise<IPromptConfigurationDocument | null> {
        return PromptConfigurationModel.findOne({ enabled: true, isDeleted: { $ne: true } }).sort({ promptVersion: -1 }).exec();
    }
}
