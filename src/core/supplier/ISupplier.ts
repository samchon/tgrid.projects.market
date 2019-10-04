export interface ISupplier
{
    uid: number;
    performance: ISupplier.IPerformance;
    free: boolean;
}
export namespace ISupplier
{
    export interface IPerformance
    {
        mean: number;
        risk: number;
        credit: number;
    }
}