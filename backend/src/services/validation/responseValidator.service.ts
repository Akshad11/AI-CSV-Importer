import { aiResponseSchema } from "../../schemas/aiResponse.schema";
import { extractJson } from "../../utils/extractJson";

export class ResponseValidatorService {
    validate(response: string) {
        const json = extractJson(response);
        let parsed = JSON.parse(json);

        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            const arrayKey = Object.keys(parsed).find(key => Array.isArray(parsed[key]));
            if (arrayKey) {
                parsed = parsed[arrayKey];
            } else {
                parsed = [parsed];
            }
        }

        return aiResponseSchema.parse(parsed);
    }
}

export const responseValidator =
    new ResponseValidatorService();