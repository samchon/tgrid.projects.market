import { EventEmitter } from "events";

import { WebConnector } from "tgrid/protocols/web";
import { WorkerConnector, SharedWorkerConnector } from "tgrid/protocols/workers";
import { Driver } from "tgrid/components/Driver";

import { IPointer } from "tstl/functional/IPointer";
import { SupplierChannel } from "../market/SupplierChannel";

export class Supplier extends EventEmitter
{
    public readonly uid: number;

    /**
     * @hidden
     */
    private connector_: Connector;

    /* ----------------------------------------------------------------
        CONSTRUCTOR
    ---------------------------------------------------------------- */
    /**
     * @hidden
     */
    private constructor(uid: number, connector: Connector)
    {
        super();

        this.uid = uid;
        this.connector_ = connector;
    }

    public static async participate(url: string): Promise<Supplier>
    {
        // POINTERS - LAZY CONSTRUCTION
        let basePtr: IPointer<Supplier> = { value: null! };
        let workerPtr: IPointer<WorkerConnector> = { value: null! };

        // PREPARE ASSETS
        let provider = new Supplier.Provider(basePtr, workerPtr);
        let connector: WebConnector<Supplier.Provider> = new WebConnector(provider);
        let driver: Driver<SupplierChannel.IController> = connector.getDriver<SupplierChannel.IController>();

        // CONSTRUCT WORKER
        let worker: WorkerConnector = new WorkerConnector(driver.provider);
        workerPtr.value = worker;

        // CONNECTION & CONSTRUCTION
        await connector.connect(url);
        let ret: Supplier = new Supplier(await driver.getUID(), connector);
        basePtr.value = ret;

        // RETURNS
        return ret;
    }

    public assign(consumerUID: number): void
    {
        this.emit("assign", consumerUID);
    }

    public leave(): Promise<void>
    {
        return this.connector_.close();
    }
}

export namespace Supplier
{
    /**
     * @internal
     */
    export interface IController
    {
        provider: object;

        assign(consumerUID: number): void;
        compile(script: string, ...args: string[]): Promise<void>;
        close(): Promise<void>;
    }

    /**
     * @internal
     */
    export class Provider implements IController
    {
        private base_ptr_: IPointer<Supplier>;
        private worker_ptr_: IPointer<WorkerConnector>;

        /* ----------------------------------------------------------------
            CONSTRUCTOR
        ---------------------------------------------------------------- */
        public constructor(basePtr: IPointer<Supplier>, workerPtr: IPointer<WorkerConnector>)
        {
            this.base_ptr_ = basePtr;
            this.worker_ptr_ = workerPtr;
        }

        public assign(consumerUID: number): void
        {
            this.base_ptr_.value.assign(consumerUID);
        }

        public async compile(code: string, ...args: string[]): Promise<void>
        {
            // FOR SAFETY
            let state = this.worker_ptr_.value.state;
            if (state !== WorkerConnector.State.NONE && state !== WorkerConnector.State.CLOSED)
                await this.worker_ptr_.value.close();

            // DO COMPILE
            console.log("do compile", code.length, args.length);
            await this.worker_ptr_.value.compile(code, ...args);

            // EMIT EVENTS
            this.base_ptr_.value.emit("compile", code, ...args);
            this.worker_ptr_.value.join().then(() =>
            {
                this.base_ptr_.value.emit("close");
            });
        }

        public close(): Promise<void>
        {
            return this.worker_ptr_.value.close();
        }

        /* ----------------------------------------------------------------
            ACCESSORS
        ---------------------------------------------------------------- */
        public get provider(): Driver<object>
        {
            return this.worker_ptr_.value.getDriver<object>();
        }

        public isFree(): boolean
        {
            return this.worker_ptr_.value.state === WorkerConnector.State.NONE
                || this.worker_ptr_.value.state === WorkerConnector.State.CLOSED;
        }
    }
}

type Connector = WebConnector<Supplier.Provider> | SharedWorkerConnector<Supplier.Provider>;