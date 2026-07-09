import { IStage, Pipeline } from "./Orchestrator.types";
import { PipelineExecutor } from "./PipelineExecutor";

export class PipelineBuilder {
    private readonly stages: IStage[] = [];

    /**
     * Appends a stage to the pipeline.
     */
    public addStage(stage: IStage): this {
        this.stages.push(stage);
        return this;
    }

    /**
     * Assembles the pipeline into an executable Pipeline instance.
     */
    public build(): Pipeline {
        return new PipelineExecutor(this.stages);
    }
}
