import { Container } from "./container";
import { ImportRepository } from "../database/repositories/ImportRepository";
import { ImportRecordRepository } from "../database/repositories/ImportRecordRepository";
import { SkippedRepository } from "../database/repositories/SkippedRepository";
import { ProviderRepository } from "../database/repositories/ProviderRepository";
import { ModelRepository } from "../database/repositories/ModelRepository";
import { PromptRepository } from "../database/repositories/PromptRepository";
import { SettingsRepository } from "../database/repositories/SettingsRepository";
import { StatisticsRepository } from "../database/repositories/StatisticsRepository";
import { LogRepository } from "../database/repositories/LogRepository";
import { UserPreferenceRepository } from "../database/repositories/UserPreferenceRepository";

export const globalContainer = new Container();

// Register repositories as singletons
globalContainer.registerSingleton("ImportRepository", new ImportRepository());
globalContainer.registerSingleton("ImportRecordRepository", new ImportRecordRepository());
globalContainer.registerSingleton("SkippedRepository", new SkippedRepository());
globalContainer.registerSingleton("ProviderRepository", new ProviderRepository());
globalContainer.registerSingleton("ModelRepository", new ModelRepository());
globalContainer.registerSingleton("PromptRepository", new PromptRepository());
globalContainer.registerSingleton("SettingsRepository", new SettingsRepository());
globalContainer.registerSingleton("StatisticsRepository", new StatisticsRepository());
globalContainer.registerSingleton("LogRepository", new LogRepository());
globalContainer.registerSingleton("UserPreferenceRepository", new UserPreferenceRepository());
