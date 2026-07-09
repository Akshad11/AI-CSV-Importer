import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../src/app";

describe("Importer Status E2E Test", () => {
    it("successfully retrieves current operational status parameters", async () => {
        const res = await request(app)
            .get("/api/v1/importer/status");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeDefined();
    });
});
