import { ImportJobModel, IImportJobDocument } from "../models/ImportJob.model";

export class ImportRepository {
    public async create(data: Partial<IImportJobDocument>): Promise<IImportJobDocument> {
        return ImportJobModel.create(data);
    }

    public async findById(id: string): Promise<IImportJobDocument | null> {
        return ImportJobModel.findOne({ importId: id, isDeleted: { $ne: true } }).exec();
    }

    public async update(id: string, updateData: Partial<IImportJobDocument>): Promise<IImportJobDocument | null> {
        return ImportJobModel.findOneAndUpdate(
            { importId: id, isDeleted: { $ne: true } },
            updateData,
            { returnDocument: "after" }
        ).exec();
    }

    public async delete(id: string): Promise<boolean> {
        // Soft delete
        const result = await ImportJobModel.findOneAndUpdate(
            { importId: id, isDeleted: { $ne: true } },
            { isDeleted: true, deletedAt: new Date() }
        ).exec();
        return !!result;
    }

    public async list(filters: {
        status?: string;
        provider?: string;
        model?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        page?: number;
    } = {}): Promise<{ items: IImportJobDocument[]; total: number }> {
        const query: any = { isDeleted: { $ne: true } };

        if (filters.status) {
            query.status = filters.status;
        }
        if (filters.provider) {
            query.aiProvider = filters.provider;
        }
        if (filters.model) {
            query.aiModel = filters.model;
        }
        if (filters.startDate || filters.endDate) {
            query.createdAt = {};
            if (filters.startDate) {
                query.createdAt.$gte = filters.startDate;
            }
            if (filters.endDate) {
                query.createdAt.$lte = filters.endDate;
            }
        }

        const limit = filters.limit || 10;
        const page = filters.page || 1;
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            ImportJobModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            ImportJobModel.countDocuments(query).exec()
        ]);

        return { items, total };
    }
}
