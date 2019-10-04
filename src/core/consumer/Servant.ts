import { Driver } from "tgrid/components/Driver";
import { ConditionVariable } from "tstl/thread/ConditionVariable";

import { ISupplier } from "../supplier/ISupplier";
import { Supplier } from "../supplier/Supplier";

export class Servant implements Readonly<ISupplier>
{
    /**
     * @hidden
     */
    private base_: ISupplier;

    /**
     * @hidden
     */
    private assignee_: Driver<Supplier.IController>;

    /**
     * @hidden
     */
    private joiners_: ConditionVariable;

    /**
     * @hidden
     */
    private provider_?: object | null;

    /* ----------------------------------------------------------------
        CONSTRUCTORS
    ---------------------------------------------------------------- */
    /**
     * @hidden
     */
    private constructor(base: ISupplier, driver: Driver<Supplier.IController>)
    {
        this.base_ = base;
        this.assignee_ = driver;

        this.joiners_ = new ConditionVariable();
    }

    /**
     * @internal
     */
    public static create(base: ISupplier, driver: Driver<Supplier.IController>): Servant
    {
        return new Servant(base, driver);
    }

    public async compile(provider: object | null, script: string, ...args: string[]): Promise<void>
    {
        this.provider_ = provider;
        await this.assignee_.compile(script, ...args);
    }

    public async close(): Promise<void>
    {
        await this.assignee_.close();
        await this.joiners_.notify_all();
    }

    /* ----------------------------------------------------------------
        ACCESSORS
    ---------------------------------------------------------------- */
    public get provider(): object | null | undefined
    {
        return this.provider_;
    }

    public getDriver<Controller extends object>(): Driver<Controller>
    {
        return this.assignee_.provider as Driver<Controller>;
    }

    public join(): Promise<void>;
    public join(ms: number): Promise<boolean>;
    public join(until: Date): Promise<boolean>;

    public join(param?: number | Date): Promise<void | boolean>
    {
        if (param === undefined)
            return this.joiners_.wait();
        else if (param instanceof Date)
            return this.joiners_.wait_until(param);
        else
            return this.joiners_.wait_for(param);
    }
    
    /* ----------------------------------------------------------------
        PROPERTIES
    ---------------------------------------------------------------- */
    public get uid(): number
    {
        return this.base_.uid;
    }
    public get performance(): ISupplier.IPerformance
    {
        return this.base_.performance;
    }
    public get free(): boolean
    {
        return false;
    }
}

export namespace Servant
{
    /**
     * @internal
     */
    export interface IController
    {
        provider: object;

        join(): Promise<void>;
        close(): Promise<void>;
    }

    /**
     * @internal
     */
    export class Provider
    {
        private base_: Servant;

        public constructor(base: Servant)
        {
            this.base_ = base;
        }

        public get provider(): object
        {
            return this.base_.provider!;
        }

        public join(): Promise<void>
        {
            return this.base_.join();
        }

        public close(): Promise<void>
        {
            return this.base_.close();
        }
    }
}