export interface IProgressReporter<T = unknown> {
    reportProgress(progress: T): void;
}
