import { CancellationToken } from "../cancellation/CancellationToken";

export interface ICancellable {
    registerToken(token: CancellationToken): void;
}
