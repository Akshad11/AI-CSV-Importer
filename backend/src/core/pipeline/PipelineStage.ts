import { ImportContext } from "./ImportContext";
import { ImportResult } from "./ImportResult";

export abstract class PipelineStage {
    public abstract readonly name: string;

    /**
     * Executes the logic for this specific pipeline stage.
     */
    public abstract execute(context: ImportContext): Promise<ImportResult>;
}
