import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../src/app";
import * as path from "path";

describe("Importer Upload E2E Test", () => {
    it("successfully uploads a valid CSV file returning parsed response", async () => {
        const filePath = path.resolve(__dirname, "../fixtures/csv/valid.csv");
        const res = await request(app)
            .post("/api/v1/importer/upload")
            .attach("file", filePath);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain("CSV parsed successfully");
    });

    it("returns 400 Bad Request when executing upload without file body", async () => {
        const res = await request(app)
            .post("/api/v1/importer/upload");

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
});
