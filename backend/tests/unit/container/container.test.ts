import { describe, expect, it } from "vitest";
import { Container } from "../../../src/container/container";

describe("Dependency Injection Container", () => {
    it("resolves singleton registrations to the same instance", () => {
        const container = new Container();
        class TestService {}

        container.registerSingleton("test", TestService);

        const instance1 = container.resolve<TestService>("test");
        const instance2 = container.resolve<TestService>("test");

        expect(instance1).toBeInstanceOf(TestService);
        expect(instance1).toBe(instance2);
    });

    it("resolves transient registrations to new instances", () => {
        const container = new Container();
        class TestService {}

        container.registerTransient("test", TestService);

        const instance1 = container.resolve<TestService>("test");
        const instance2 = container.resolve<TestService>("test");

        expect(instance1).toBeInstanceOf(TestService);
        expect(instance2).toBeInstanceOf(TestService);
        expect(instance1).not.toBe(instance2);
    });

    it("resolves raw values as singletons", () => {
        const container = new Container();
        const config = { apiKey: "12345" };

        container.registerSingleton("config", config);

        const resolved = container.resolve<typeof config>("config");
        expect(resolved).toBe(config);
        expect(resolved.apiKey).toBe("12345");
    });

    it("supports factory functions for singletons", () => {
        const container = new Container();
        let calls = 0;
        container.registerSingleton("factory", () => {
            calls++;
            return { value: calls };
        });

        const res1 = container.resolve<{ value: number }>("factory");
        const res2 = container.resolve<{ value: number }>("factory");

        expect(res1.value).toBe(1);
        expect(res2.value).toBe(1);
        expect(calls).toBe(1);
    });

    it("supports constructor injection via static inject array", () => {
        const container = new Container();

        class Logger {
            log(msg: string) {
                return msg;
            }
        }

        class UserService {
            static inject = ["logger"];
            constructor(public logger: Logger) {}
        }

        container.registerSingleton("logger", Logger);
        container.registerSingleton("userService", UserService);

        const userService = container.resolve<UserService>("userService");
        expect(userService).toBeInstanceOf(UserService);
        expect(userService.logger).toBeInstanceOf(Logger);
        expect(userService.logger.log("hello")).toBe("hello");
    });

    it("throws when a duplicate service is registered", () => {
        const container = new Container();
        class TestService {}

        container.registerSingleton("test", TestService);
        expect(() => {
            container.registerSingleton("test", TestService);
        }).toThrow("Service [test] is already registered.");
    });

    it("throws when resolving an unknown service token", () => {
        const container = new Container();
        expect(() => {
            container.resolve("nonexistent");
        }).toThrow("No service registered for token [nonexistent].");
    });

    it("detects circular dependencies and throws descriptive error", () => {
        const container = new Container();

        class ServiceA {
            static inject = ["serviceB"];
            constructor(public serviceB: unknown) {}
        }

        class ServiceB {
            static inject = ["serviceA"];
            constructor(public serviceA: unknown) {}
        }

        container.registerTransient("serviceA", ServiceA);
        container.registerTransient("serviceB", ServiceB);

        expect(() => {
            container.resolve("serviceA");
        }).toThrow("Circular dependency detected: serviceA -> serviceB -> serviceA");
    });
});
