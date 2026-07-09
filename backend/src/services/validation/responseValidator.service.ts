import { aiResponseSchema } from "../../schemas/aiResponse.schema";
import { extractJson } from "../../utils/extractJson";

export class ResponseValidatorService {
    validate(response: string) {
        const json = extractJson(response);

        const parsed = JSON.parse(json);

        return aiResponseSchema.parse(parsed);
    }
}

export const responseValidator =
    new ResponseValidatorService();