import { describe, expect, it } from "vitest";
import { promptBuilder } from "../../../src/services/ai/promptBuilder.service";

describe("Prompt Builder", () => {
    it("creates prompts", () => {
        const prompt = promptBuilder.build({
            batch: {
                id: "1",
                batchNumber: 1,
                totalRows: 1,
                rows: [
                    {
                        Name: "John",
                        Email: "john@example.com"
                    }
                ]
            }
        });

        expect(prompt.system).toContain("CRM");

        expect(prompt.user).toContain("john@example.com");
    });
});