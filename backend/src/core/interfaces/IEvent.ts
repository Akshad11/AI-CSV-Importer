export interface IEvent {
    readonly name: string;
    readonly timestamp: Date;
    readonly payload: unknown;
}
