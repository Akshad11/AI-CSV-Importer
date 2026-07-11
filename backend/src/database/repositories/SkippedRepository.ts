import { SkippedRecordModel, ISkippedRecordDocument } from "../models/SkippedRecord.model";

export class SkippedRepository {
    public async create(data: Partial<ISkippedRecordDocument>): Promise<ISkippedRecordDocument> {
        return SkippedRecordModel.create(data);
    }

    public async insertMany(records: Partial<ISkippedRecordDocument>[]): Promise<ISkippedRecordDocument[]> {
        const docs = await SkippedRecordModel.insertMany(records);
        return docs as any;
    }

    public async findByImportId(
        importId: string,
        limit = 50,
        page = 1
    ): Promise<{ items: ISkippedRecordDocument[]; total: number }> {
        const query = { importId, isDeleted: { $ne: true } };
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            SkippedRecordModel.find(query).skip(skip).limit(limit).exec(),
            SkippedRecordModel.countDocuments(query).exec()
        ]);

        return { items, total };
    }

    public async deleteByImportId(importId: string): Promise<void> {
        await SkippedRecordModel.updateMany(
            { importId, isDeleted: { $ne: true } },
            { isDeleted: true, deletedAt: new Date() }
        ).exec();
    }
}
