export interface IService {
    dispose?(): Promise<void> | void;
}
