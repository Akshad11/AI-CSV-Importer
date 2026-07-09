import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";

import routes from "./routes";

import { requestLogger } from "./middlewares/requestLogger.middleware";
import { requestIdMiddleware } from "./middlewares/requestId.middleware";
import { rateLimiter } from "./middlewares/rateLimiter.middleware";
import { errorHandler } from "./errors/errorHandler";

const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(cors());

app.use(compression());

app.use(requestIdMiddleware);

app.use(requestLogger);

app.use(rateLimiter);

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true,
    })
);

app.use("/", routes);

app.use(errorHandler);

export default app;