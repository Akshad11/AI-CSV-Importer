import { describe, expect, it } from "vitest";
import { responseValidator } from "../../../src/services/validation/responseValidator.service";

describe("Response Validator", () => {
    it("validates AI output", () => {
        const response = `
Some explanation

[
{
"created_at":"2026-05-13 14:20:48",
"name":"John Doe",
"email":"john.doe@example.com",
"company":"GrowEasy",
"mobile_without_country_code":"9876543210",
"crm_status":"GOOD_LEAD_FOLLOW_UP"
}
]
`;

        const result =
            responseValidator.validate(response);

        expect(result.length).toBe(1);

        expect(result[0].email)
            .toBe("john.doe@example.com");
    });
});