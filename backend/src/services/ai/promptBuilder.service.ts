import { PromptBuildOptions } from "../../prompts/prompt.types";
import { SYSTEM_PROMPT } from "../../prompts/system.prompt";
import { IMPORTER_PROMPT } from "../../prompts/importer.prompt";

export class PromptBuilderService {
    build(options: PromptBuildOptions) {
        const csvDataStr = JSON.stringify(options.batch.rows, null, 2);
        const userPrompt = IMPORTER_PROMPT.replace("{{CSV_DATA}}", csvDataStr);

        const finalPrompt = `
            ${userPrompt.trim()}

            IMPORTANT

            If your response contains ANY character before '[' or after ']',
            your response is INVALID.

            Do not explain.
            Do not apologize.
            Do not think aloud.
            Do not summarize.
            Do not mention the rules.

            Return ONLY the JSON array.

            BEGIN_JSON
            `.trim();

        return {
            system: SYSTEM_PROMPT.trim(),
            user: finalPrompt
        };
    }
}

export const promptBuilder =
    new PromptBuilderService();