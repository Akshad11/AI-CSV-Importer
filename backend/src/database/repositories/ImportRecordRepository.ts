import { ImportRecordModel, IImportRecordDocument } from "../models/ImportRecord.model";

export class ImportRecordRepository {
    public async create(data: Partial<IImportRecordDocument>): Promise<IImportRecordDocument> {
        return ImportRecordModel.create(data);
    }

    public async insertMany(records: Partial<IImportRecordDocument>[]): Promise<IImportRecordDocument[]> {
        const docs = await ImportRecordModel.insertMany(records);
        return docs as any;
    }

    public async findByImportId(
        importId: string,
        filters: {
            email?: string;
            mobile?: string;
            company?: string;
            crmStatus?: string;
            leadOwner?: string;
            country?: string;
            limit?: number;
            page?: number;
        } = {}
    ): Promise<{ items: IImportRecordDocument[]; total: number }> {
        const query: any = { importId, isDeleted: { $ne: true } };

        if (filters.email) {
            query.email = new RegExp(filters.email, "i");
        }
        if (filters.mobile) {
            query.mobile = new RegExp(filters.mobile, "i");
        }
        if (filters.company) {
            query.company = new RegExp(filters.company, "i");
        }
        if (filters.crmStatus) {
            query.crmStatus = filters.crmStatus;
        }
        if (filters.leadOwner) {
            query.leadOwner = new RegExp(filters.leadOwner, "i");
        }
        if (filters.country) {
            query.country = new RegExp(filters.country, "i");
        }

        const limit = filters.limit || 50;
        const page = filters.page || 1;
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            ImportRecordModel.find(query).skip(skip).limit(limit).exec(),
            ImportRecordModel.countDocuments(query).exec()
        ]);

        return { items, total };
    }

    public async update(id: string, updateData: Partial<IImportRecordDocument>): Promise<IImportRecordDocument | null> {
        return ImportRecordModel.findByIdAndUpdate(
            id,
            updateData,
            { returnDocument: "after" }
        ).exec();
    }

    public async deleteByImportId(importId: string): Promise<void> {
        await ImportRecordModel.updateMany(
            { importId, isDeleted: { $ne: true } },
            { isDeleted: true, deletedAt: new Date() }
        ).exec();
    }
}
