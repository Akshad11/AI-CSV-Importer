import { ProcessingLogModel, IProcessingLogDocument } from "../models/ProcessingLog.model";

export class LogRepository {
    public async create(data: Partial<IProcessingLogDocument>): Promise<IProcessingLogDocument> {
        return ProcessingLogModel.create(data);
    }

    public async insertMany(logs: Partial<IProcessingLogDocument>[]): Promise<IProcessingLogDocument[]> {
        const docs = await ProcessingLogModel.insertMany(logs);
        return docs as any;
    }

    public async findByImportId(importId: string): Promise<IProcessingLogDocument[]> {
        return ProcessingLogModel.find({ importId, isDeleted: { $ne: true } })
            .sort({ timestamp: 1 })
            .exec();
    }

    public async deleteByImportId(importId: string): Promise<void> {
        await ProcessingLogModel.updateMany(
            { importId, isDeleted: { $ne: true } },
            { isDeleted: true, deletedAt: new Date() }
        ).exec();
    }
}
