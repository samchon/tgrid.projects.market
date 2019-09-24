import { IPerformance } from "./IPerformance";

export interface ISupplier
{
    uid: number;
    performance: IPerformance;
    free: boolean;
}