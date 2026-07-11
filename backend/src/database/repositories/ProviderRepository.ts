import { AIProviderModel, IAIProviderDocument } from "../models/AIProvider.model";

export class ProviderRepository {
    public async create(data: Partial<IAIProviderDocument>): Promise<IAIProviderDocument> {
        return AIProviderModel.create(data);
    }

    public async findByName(providerName: string): Promise<IAIProviderDocument | null> {
        return AIProviderModel.findOne({ providerName, isDeleted: { $ne: true } }).exec();
    }

    public async findById(id: string): Promise<IAIProviderDocument | null> {
        return AIProviderModel.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
    }

    public async update(id: string, updateData: Partial<IAIProviderDocument>): Promise<IAIProviderDocument | null> {
        return AIProviderModel.findOneAndUpdate(
            { _id: id, isDeleted: { $ne: true } },
            updateData,
            { returnDocument: "after" }
        ).exec();
    }

    public async delete(id: string): Promise<boolean> {
        const result = await AIProviderModel.findOneAndUpdate(
            { _id: id, isDeleted: { $ne: true } },
            { isDeleted: true, deletedAt: new Date() }
        ).exec();
        return !!result;
    }

    public async list(filters: { enabled?: boolean } = {}): Promise<IAIProviderDocument[]> {
        const query: any = { isDeleted: { $ne: true } };
        if (filters.enabled !== undefined) {
            query.enabled = filters.enabled;
        }
        return AIProviderModel.find(query).sort({ priority: 1, providerName: 1 }).exec();
    }
}
