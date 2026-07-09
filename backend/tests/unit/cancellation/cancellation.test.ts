import { describe, expect, it } from "vitest";
import { CancellationToken } from "../../../src/core/cancellation/CancellationToken";
import { CancellationError } from "../../../src/core/cancellation/CancellationError";

describe("Cancellation Token", () => {
    it("is not cancelled by default", () => {
        const token = new CancellationToken();
        expect(token.isCancelled).toBe(false);
        expect(token.reason).toBeUndefined();
        expect(token.timestamp).toBeUndefined();
        expect(() => token.throwIfCancelled()).not.toThrow();
    });

    it("transitions to cancelled state when cancel is called", () => {
        const token = new CancellationToken();
        token.cancel("User request");

        expect(token.isCancelled).toBe(true);
        expect(token.reason).toBe("User request");
        expect(token.timestamp).toBeInstanceOf(Date);
        expect(() => token.throwIfCancelled()).toThrow(CancellationError);
        expect(() => token.throwIfCancelled()).toThrow("User request");
    });

    it("triggers registered callbacks on cancellation", () => {
        const token = new CancellationToken();
        let called1 = false;
        let called2 = false;

        token.onCancelled(() => {
            called1 = true;
        });
        token.onCancelled(() => {
            called2 = true;
        });

        token.cancel();

        expect(called1).toBe(true);
        expect(called2).toBe(true);
    });

    it("executes callback immediately if token is already cancelled", () => {
        const token = new CancellationToken();
        token.cancel("Already done");

        let called = false;
        token.onCancelled(() => {
            called = true;
        });

        expect(called).toBe(true);
    });

    it("does not execute callback if unsubscribed before cancellation", () => {
        const token = new CancellationToken();
        let called = false;

        const unsubscribe = token.onCancelled(() => {
            called = true;
        });

        unsubscribe();
        token.cancel();

        expect(called).toBe(false);
    });

    it("isolates errors in cancellation callbacks so others still execute", () => {
        const token = new CancellationToken();
        let secondCalled = false;

        token.onCancelled(() => {
            throw new Error("Callback failed");
        });

        token.onCancelled(() => {
            secondCalled = true;
        });

        // Should not throw, should execute second callback
        expect(() => token.cancel()).not.toThrow();
        expect(secondCalled).toBe(true);
    });

    it("creates cancelled token correctly using static factory", () => {
        const token = CancellationToken.cancelled("custom error");
        expect(token.isCancelled).toBe(true);
        expect(token.reason).toBe("custom error");
    });

    it("returns correct default values for None token", () => {
        const token = CancellationToken.None;
        expect(token.isCancelled).toBe(false);
        expect(() => token.throwIfCancelled()).not.toThrow();
    });
});
