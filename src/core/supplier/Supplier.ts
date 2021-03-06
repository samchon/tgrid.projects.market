import { EventEmitter } from "events";

import { WebConnector } from "tgrid/protocols/web/WebConnector";
import { WorkerConnector } from "tgrid/protocols/workers/WorkerConnector";
import { Driver } from "tgrid/components/Driver";

import { IPointer } from "tstl/functional/IPointer";
import { SupplierChannel } from "../market/SupplierChannel";

export class Supplier extends EventEmitter
{
    public readonly uid: number;

    /**
     * @hidden
     */
    private connector_: WebConnector<Supplier.Provider>;

    /* ----------------------------------------------------------------
        CONSTRUCTOR
    ---------------------------------------------------------------- */
    /**
     * @hidden
     */
    private constructor(uid: number, connector: WebConnector<Supplier.Provider>)
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
        private consumer_uid_?: number;

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
            this.consumer_uid_ = consumerUID;
            this.base_ptr_.value.emit("assign", consumerUID);
        }

        public async compile(code: string, ...args: string[]): Promise<void>
        {
            // FOR SAFETY
            let state = this.worker_ptr_.value.state;
            if (state !== WorkerConnector.State.NONE && state !== WorkerConnector.State.CLOSED)
                await this.worker_ptr_.value.close();

            // DO COMPILE
            await this.worker_ptr_.value.compile(code, ...args);

            // EMIT EVENTS
            this.base_ptr_.value.emit("compile", this.consumer_uid_, code, ...args);
            this.worker_ptr_.value.join().then(() =>
            {
                this.base_ptr_.value.emit("close", this.consumer_uid_);
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
