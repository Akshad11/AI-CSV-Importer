import * as http from "http";

export class TestServer {
    private server: http.Server | null = null;
    private responseStatus = 200;
    private responseBody: any = { success: true };
    private delayMs = 0;

    /**
     * Starts the local mock HTTP server on the specified port.
     */
    public start(port = 4500): Promise<void> {
        this.server = http.createServer(async (req, res) => {
            if (this.delayMs > 0) {
                await new Promise((resolve) => setTimeout(resolve, this.delayMs));
            }

            res.writeHead(this.responseStatus, { "Content-Type": "application/json" });
            res.end(JSON.stringify(this.responseBody));
        });

        return new Promise<void>((resolve) => {
            this.server?.listen(port, () => {
                resolve();
            });
        });
    }

    public setResponse(status: number, body: any, delayMs = 0): void {
        this.responseStatus = status;
        this.responseBody = body;
        this.delayMs = delayMs;
    }

    /**
     * Stops and closes the server.
     */
    public stop(): Promise<void> {
        return new Promise<void>((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}
