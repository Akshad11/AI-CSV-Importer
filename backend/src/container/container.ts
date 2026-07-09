export type Factory<T> = (container: Container) => T;

export interface Constructor<T> {
    new (...args: any[]): T;
    inject?: string[];
}

type RegistrationType = "singleton" | "transient";

interface Registration<T = unknown> {
    type: RegistrationType;
    token: string;
    builder: (container: Container) => T;
    resolvedInstance?: T;
}

export class Container {
    private registry = new Map<string, Registration>();
    private resolutionStack = new Set<string>();

    /**
     * Helper to detect if a value is a class constructor.
     */
    private isClass<T>(value: unknown): value is Constructor<T> {
        if (typeof value !== "function") return false;

        // Check if it's an ES6 class
        const str = value.toString();
        if (str.startsWith("class ")) return true;

        // Check if it has a static inject property
        if ("inject" in value && Array.isArray((value as { inject?: unknown }).inject)) {
            return true;
        }

        // Check for constructor function with prototype methods
        const prototype = value.prototype;
        return (
            !!prototype &&
            typeof prototype === "object" &&
            prototype.constructor === value &&
            Object.getOwnPropertyNames(prototype).length > 0
        );
    }

    /**
     * Register a singleton dependency.
     */
    public registerSingleton<T>(
        token: string,
        implementation: Constructor<T> | Factory<T> | T
    ): void {
        if (this.registry.has(token)) {
            throw new Error(`Service [${token}] is already registered.`);
        }

        let builder: (container: Container) => T;

        if (this.isClass<T>(implementation)) {
            builder = (container: Container) => {
                const injectTokens = (implementation as Constructor<T>).inject || [];
                const args = injectTokens.map((dep) => container.resolve<unknown>(dep));
                return new (implementation as Constructor<T>)(...args);
            };
        } else if (typeof implementation === "function") {
            builder = (container: Container) => (implementation as Factory<T>)(container);
        } else {
            // Raw value
            builder = () => implementation as T;
        }

        this.registry.set(token, {
            type: "singleton",
            token,
            builder,
        });
    }

    /**
     * Register a transient dependency.
     */
    public registerTransient<T>(
        token: string,
        implementation: Constructor<T> | Factory<T>
    ): void {
        if (this.registry.has(token)) {
            throw new Error(`Service [${token}] is already registered.`);
        }

        let builder: (container: Container) => T;

        if (this.isClass<T>(implementation)) {
            builder = (container: Container) => {
                const injectTokens = (implementation as Constructor<T>).inject || [];
                const args = injectTokens.map((dep) => container.resolve<unknown>(dep));
                return new (implementation as Constructor<T>)(...args);
            };
        } else if (typeof implementation === "function") {
            builder = (container: Container) => (implementation as Factory<T>)(container);
        } else {
            throw new Error(
                `Transient registration for [${token}] must be a class constructor or a factory function.`
            );
        }

        this.registry.set(token, {
            type: "transient",
            token,
            builder,
        });
    }

    /**
     * Resolve a dependency.
     */
    public resolve<T>(token: string): T {
        const registration = this.registry.get(token);
        if (!registration) {
            throw new Error(`No service registered for token [${token}].`);
        }

        if (this.resolutionStack.has(token)) {
            const path = Array.from(this.resolutionStack).join(" -> ");
            throw new Error(`Circular dependency detected: ${path} -> ${token}`);
        }

        if (registration.type === "singleton" && registration.resolvedInstance !== undefined) {
            return registration.resolvedInstance as T;
        }

        this.resolutionStack.add(token);

        try {
            const instance = registration.builder(this) as T;

            if (registration.type === "singleton") {
                registration.resolvedInstance = instance;
            }

            return instance;
        } finally {
            this.resolutionStack.delete(token);
        }
    }

    /**
     * Clear all registrations.
     */
    public clear(): void {
        this.registry.clear();
        this.resolutionStack.clear();
    }
}
