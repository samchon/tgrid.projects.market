import { WebConnector } from "tgrid/protocols/web";
import { SharedWorkerConnector } from "tgrid/protocols/workers";

import { EventEmitter } from "events";
import { HashMap } from "tstl/container/HashMap";
import { ConditionVariable } from "tstl/thread/ConditionVariable";
import { IPointer } from "tstl/functional/IPointer";

import { ConsumerNode } from "./ConsumerNode";
import { SupplierNode } from "./SupplierNode";
import { IConsumerNode } from "./IConsumerNode";
import { ISupplierNode } from "./ISupplierNode";

export class Monitor
{
    /**
     * @hidden
     */
    private connector_: Connector;

    /**
     * @hidden
     */
    private consumers_: HashMap<number, ConsumerNode>;

    /**
     * @hidden
     */
    private suppliers_: HashMap<number, SupplierNode>;

    /**
     * @hidden
     */
    private emitter_: EventEmitter;

    /* ----------------------------------------------------------------
        CONSTRUCTORS
    ---------------------------------------------------------------- */
    /**
     * @hidden
     */
    private constructor(connector: Connector)
    {
        this.connector_ = connector;

        this.consumers_ = new HashMap();
        this.suppliers_ = new HashMap();
        this.emitter_ = new EventEmitter();
    }

    /**
     * @internal
     */
    public static async participate(url: string): Promise<Monitor>
    {
        // PREPARE ASSETS
        let ptr: IPointer<Monitor> = { value: null! };
        let waitor: ConditionVariable = new ConditionVariable();

        let provider: Monitor.Provider = new Monitor.Provider(ptr, waitor);
        let connector: WebConnector = new WebConnector(provider);

        // LAZY CREATION
        ptr.value = new Monitor(connector);

        // CONNECT & WAIT MARKET
        await connector.connect(url);
        await waitor.wait();

        // RETURNS
        return ptr.value;
    }

    public leave(): Promise<void>
    {
        return this.connector_.close();
    }

    /* ----------------------------------------------------------------
        ACCESSORS
    ---------------------------------------------------------------- */
    public on(type: "refresh", listener: (consumers: HashMap<number, ConsumerNode>, suppliers: HashMap<number, SupplierNode>) => void): void
    {
        this.emitter_.on(type, listener);
    }

    public getConsumers(): HashMap<number, ConsumerNode>
    {
        return this.consumers_;
    }

    public getSuppliers(): HashMap<number, SupplierNode>
    {
        return this.suppliers_;
    }
    
    /**
     * @internal
     */
    public _Refresh(): void
    {
        this.emitter_.emit("refresh", this.consumers_, this.suppliers_);
    }
}

export namespace Monitor
{
    /**
     * @internal
     */
    export interface IController
    {
        assign(consumers: IConsumerNode[], suppliers: ISupplierNode[]): Promise<void>;

        insertConsumer(consumer :IConsumerNode): void;
        insertSupplier(supplier: ISupplierNode): void;
        eraseConsumer(uid: number): void;
        eraseSupplier(uid: number): void;

        link(consumer: number, supplier: number): void;
        release(uid: number): void;
    }

    /**
     * @internal
     */
    export class Provider implements IController
    {
        private ptr_: IPointer<Monitor>;
        private waitor_: ConditionVariable;

        /* ----------------------------------------------------------------
            CONSTRUCTORS
        ---------------------------------------------------------------- */
        public constructor(ptr: IPointer<Monitor>, waitor: ConditionVariable)
        {
            this.ptr_ = ptr;
            this.waitor_ = waitor;
        }

        public async assign(rawConsumers: IConsumerNode[], rawSuppliers: ISupplierNode[]): Promise<void>
        {
            let base: Monitor = this.ptr_.value;
            for (let raw of rawSuppliers)
                base.getSuppliers().emplace(raw.uid, new SupplierNode(raw.uid));
                
            for (let raw of rawConsumers)
            {
                let consumer: ConsumerNode = new ConsumerNode(raw.uid);
                for (let uid of raw.servants)
                {
                    let supplier: SupplierNode = base.getSuppliers().get(uid);
                    consumer.servants.emplace(uid, supplier);
                }
                base.getConsumers().emplace(raw.uid, consumer);
            }
            await this.waitor_.notify_all();
        }

        /* ----------------------------------------------------------------
            ELEMENTS I/O
        ---------------------------------------------------------------- */
        public insertConsumer(raw: IConsumerNode): void
        {
            let base: Monitor = this.ptr_.value;
            base.getConsumers().emplace(raw.uid, new ConsumerNode(raw.uid));
            base._Refresh();
        }

        public insertSupplier(raw: ISupplierNode): void
        {
            let base: Monitor = this.ptr_.value;
            base.getSuppliers().emplace(raw.uid, new SupplierNode(raw.uid));
            base._Refresh();
        }

        public eraseConsumer(uid: number): void
        {
            let base: Monitor = this.ptr_.value;
            
            let consumer: ConsumerNode = base.getConsumers().get(uid); 
            for (let entry of consumer.servants)
                entry.second.release();

            base.getConsumers().erase(uid);
            base._Refresh();
        }

        public eraseSupplier(uid: number): void
        {
            let base: Monitor = this.ptr_.value;

            let supplier: SupplierNode = base.getSuppliers().get(uid);
            if (supplier.assignee !== null)
                supplier.assignee.servants.erase(uid);

            supplier.release();
            base.getSuppliers().erase(uid);

            base._Refresh();
        }

        /* ----------------------------------------------------------------
            RELATIONSHIPS
        ---------------------------------------------------------------- */
        public link(customerUID: number, supplierUID: number): void
        {
            let base: Monitor = this.ptr_.value;
            let consumer: ConsumerNode = base.getConsumers().get(customerUID);
            let supplier: SupplierNode = base.getSuppliers().get(supplierUID);

            consumer.servants.emplace(supplier.uid, supplier);
            supplier.assign(consumer);

            base._Refresh();
        }

        public release(uid: number): void
        {
            let base: Monitor = this.ptr_.value;

            let supplier: SupplierNode = base.getSuppliers().get(uid);
            if (supplier.assignee !== null)
                supplier.assignee.servants.erase(uid);

            supplier.release();
            base._Refresh();
        }
    }
}

/**
 * @hidden
 */
type Connector = WebConnector | SharedWorkerConnector;