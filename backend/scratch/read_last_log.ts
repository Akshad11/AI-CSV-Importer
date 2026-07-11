import mongoose from "mongoose";
import dotenv from "dotenv";
import { ImportJobModel } from "../src/database/models/ImportJob.model";
import { ProcessingLogModel } from "../src/database/models/ProcessingLog.model";

dotenv.config();

async function run() {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/ai_csv_importer";
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    const lastJob = await ImportJobModel.findOne().sort({ createdAt: -1 }).exec();
    console.log("Last Job:", lastJob);

    const logs = await ProcessingLogModel.find({ importId: lastJob?.importId })
        .sort({ timestamp: 1 })
        .exec();

    console.log("Logs count:", logs.length);
    for (const log of logs) {
        console.log(`[${log.level}] [${log.action}] ${log.message}`);
        if (log.stackTrace) {
            console.log("Stack:", log.stackTrace);
        }
    }

    await mongoose.disconnect();
}

run().catch(console.error);
