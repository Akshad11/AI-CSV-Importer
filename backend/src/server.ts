import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";

import routes from "./routes";

import { requestLogger } from "./middlewares/requestLogger.middleware";
import { requestIdMiddleware } from "./middlewares/requestId.middleware";
import { rateLimiter } from "./middlewares/rateLimiter.middleware";
import { notFoundMiddleware } from "./middlewares/notFound.middleware";
import { errorHandler } from "./errors/errorHandler";

import { env } from "./config/env";
import { logger } from "./logger/logger";

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

app.use(notFoundMiddleware);

app.use(errorHandler);

const PORT = env.PORT;
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});

export default app;