import { AIModelModel, IAIModelDocument } from "../models/AIModel.model";

export class ModelRepository {
    public async create(data: Partial<IAIModelDocument>): Promise<IAIModelDocument> {
        return AIModelModel.create(data);
    }

    public async findById(id: string): Promise<IAIModelDocument | null> {
        return AIModelModel.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
    }

    public async findByName(provider: string, modelName: string): Promise<IAIModelDocument | null> {
        return AIModelModel.findOne({ provider, modelName, isDeleted: { $ne: true } }).exec();
    }

    public async update(id: string, updateData: Partial<IAIModelDocument>): Promise<IAIModelDocument | null> {
        return AIModelModel.findOneAndUpdate(
            { _id: id, isDeleted: { $ne: true } },
            updateData,
            { returnDocument: "after" }
        ).exec();
    }

    public async delete(id: string): Promise<boolean> {
        const result = await AIModelModel.findOneAndUpdate(
            { _id: id, isDeleted: { $ne: true } },
            { isDeleted: true, deletedAt: new Date() }
        ).exec();
        return !!result;
    }

    public async list(filters: { provider?: string; enabled?: boolean } = {}): Promise<IAIModelDocument[]> {
        const query: any = { isDeleted: { $ne: true } };
        if (filters.provider) {
            query.provider = filters.provider;
        }
        if (filters.enabled !== undefined) {
            query.enabled = filters.enabled;
        }
        return AIModelModel.find(query).sort({ provider: 1, displayName: 1 }).exec();
    }
}
