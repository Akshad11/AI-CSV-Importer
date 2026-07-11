import { csvParserService } from "../../services/csv/csvParser.service";

export class ImporterService {
    getStatus() {
        const openaiKey = process.env.OPENAI_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY;
        const localLlamaUrl = process.env.LOCAL_LLAMA_URL || process.env.LOCAL_LLAMA_AVAILABLE;

        const hasOpenAI = !!openaiKey && openaiKey.trim() !== "" && openaiKey !== "your_api_key_here";
        const hasGemini = !!geminiKey && geminiKey.trim() !== "" && geminiKey !== "your_api_key_here";
        const hasLocal = !!localLlamaUrl && localLlamaUrl.trim() !== "" && localLlamaUrl !== "false";

        return {
            status: "ready",
            message: "Importer module is initialized.",
            providers: {
                openai: hasOpenAI,
                gemini: hasGemini,
                ollama: hasLocal,
                mock: true
            }
        };
    }

    async parseCsv(filePath: string) {
        return csvParserService.stream(filePath);
    }
}

export const importerService = new ImporterService();