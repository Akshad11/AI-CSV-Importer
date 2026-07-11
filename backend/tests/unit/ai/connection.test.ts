import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../../src/app";

describe("AI Connection Test E2E/Unit", () => {
    it("successfully tests connection using mock provider", async () => {
        const res = await request(app)
            .post("/api/v1/ai/test")
            .send({
                provider: "mock",
                model: "mock-model",
                prompt: "Hello"
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.success).toBe(true);
        expect(res.body.data.provider).toBe("Mock");
        expect(res.body.data.model).toBe("mock-model");
        expect(res.body.data.response).toBeDefined();
        expect(res.body.data.latencyMs).toBeGreaterThanOrEqual(0);
        expect(res.body.data.tokens).toBeDefined();
        expect(res.body.data.tokens.prompt).toBeDefined();
        expect(res.body.data.tokens.completion).toBeDefined();
        expect(res.body.data.tokens.total).toBeDefined();
    });

    it("returns 400 if provider is missing", async () => {
        const res = await request(app)
            .post("/api/v1/ai/test")
            .send({
                model: "mock-model",
                prompt: "Hello"
            });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.code).toBe("PROVIDER_REQUIRED");
    });

    it("returns 400 if model is missing", async () => {
        const res = await request(app)
            .post("/api/v1/ai/test")
            .send({
                provider: "mock",
                prompt: "Hello"
            });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.code).toBe("MODEL_REQUIRED");
    });
});
