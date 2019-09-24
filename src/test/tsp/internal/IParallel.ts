import { Driver } from "tgrid/components/Driver";

export interface IParallel
{
    getDriver<Controller extends object>(): Driver<Controller>;
    close(): Promise<void>;
}