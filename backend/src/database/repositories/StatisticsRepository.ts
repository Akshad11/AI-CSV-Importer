import { ImportStatisticsModel, IImportStatisticsDocument } from "../models/ImportStatistics.model";

export class StatisticsRepository {
    public async create(data: Partial<IImportStatisticsDocument>): Promise<IImportStatisticsDocument> {
        return ImportStatisticsModel.create(data);
    }

    public async findByImportId(importId: string): Promise<IImportStatisticsDocument | null> {
        return ImportStatisticsModel.findOne({ importId, isDeleted: { $ne: true } }).exec();
    }

    public async update(importId: string, updateData: Partial<IImportStatisticsDocument>): Promise<IImportStatisticsDocument | null> {
        return ImportStatisticsModel.findOneAndUpdate(
            { importId, isDeleted: { $ne: true } },
            updateData,
            { returnDocument: "after" }
        ).exec();
    }

    public async deleteByImportId(importId: string): Promise<void> {
        await ImportStatisticsModel.updateMany(
            { importId, isDeleted: { $ne: true } },
            { isDeleted: true, deletedAt: new Date() }
        ).exec();
    }
}
