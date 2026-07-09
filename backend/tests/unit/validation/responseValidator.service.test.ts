import { describe, expect, it } from "vitest";
import { responseValidator } from "../../../src/services/validation/responseValidator.service";

describe("Response Validator", () => {
    it("validates AI output", () => {
        const response = `
Some explanation

[
{
"firstName":"John",
"lastName":"Doe",
"email":"john@example.com",
"company":"Acme",
"phone":"12345",
"title":"CEO"
}
]
`;

        const result =
            responseValidator.validate(response);

        expect(result.length).toBe(1);

        expect(result[0].email)
            .toBe("john@example.com");
    });
});