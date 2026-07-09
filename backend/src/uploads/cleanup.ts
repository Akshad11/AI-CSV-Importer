import { promises as fs } from "node:fs";

export async function cleanupFile(
    filePath: string
): Promise<void> {
    try {
        await fs.unlink(filePath);
    } catch {
        // Ignore cleanup failures
    }
}