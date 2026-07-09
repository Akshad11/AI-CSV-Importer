import { PromptBuildOptions } from "../../prompts/prompt.types";
import { SYSTEM_PROMPT } from "../../prompts/system.prompt";
import { IMPORTER_PROMPT } from "../../prompts/importer.prompt";

export class PromptBuilderService {
    build(options: PromptBuildOptions) {
        return {
            system: SYSTEM_PROMPT.trim(),

            user: `
${IMPORTER_PROMPT}

CSV DATA

${JSON.stringify(options.batch.rows, null, 2)}
`.trim()
        };
    }
}

export const promptBuilder =
    new PromptBuilderService();