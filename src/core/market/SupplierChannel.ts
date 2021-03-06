import { WebAcceptor } from "tgrid/protocols/web/WebAcceptor";
import { Driver } from "tgrid/components/Driver";
import { Mutex } from "tstl/thread/Mutex";
import { UniqueLock } from "tstl/thread/UniqueLock";
import { DateUtil } from "../../utils/DateUtil";

import { ISupplier } from "../supplier/ISupplier";
import { ISupplierNode } from "../monitor/ISupplierNode";
import { Supplier } from "../supplier/Supplier";

import { ConsumerChannel } from "./ConsumerChannel";

export class SupplierChannel implements Readonly<ISupplier>
{
    public readonly uid: number;
    public readonly created_at: Date;
    public readonly performance: ISupplier.IPerformance;

    private acceptor_: WebAcceptor<SupplierChannel.Provider>;
    private mutex_: Mutex;
    private consumer_: ConsumerChannel | null;
    private assigned_at_: Date | null;

    /* ----------------------------------------------------------------
        CONSTRUCTORS
    ---------------------------------------------------------------- */
    /**
     * @hidden
     */
    private constructor(uid: number, acceptor: WebAcceptor<SupplierChannel.Provider>)
    {
        this.uid = uid;
        this.created_at = new Date();

        this.acceptor_ = acceptor;
        this.performance = 
        {
            mean: 1.0,
            risk: 0.0,
            credit: 0.0
        };

        this.mutex_ = new Mutex();
        this.consumer_ = null;
        this.assigned_at_ = null;
    }

    /**
     * @internal
     */
    public static async create(uid: number, acceptor: WebAcceptor<SupplierChannel.Provider>): Promise<SupplierChannel>
    {
        let ret: SupplierChannel = new SupplierChannel(uid, acceptor);
        await ret.acceptor_.accept(new SupplierChannel.Provider(ret));

        ret._Handle_disconnection();
        return ret;
    }

    /**
     * @hidden
     */
    private async _Handle_disconnection(): Promise<void>
    {
        try { await this.acceptor_.join(); } catch {}
        await UniqueLock.lock(this.mutex_, async () =>
        {
            if (this.consumer_ !== null)
                this.consumer_.release(this);
        });
    }

    /* ----------------------------------------------------------------
        ACCESSORS
    ---------------------------------------------------------------- */
    /**
     * @inheritDoc
     */
    public get free(): boolean
    {
        return this.consumer_ === null;
    }

    public getDriver(): Driver<Supplier.IController>
    {
        return this.acceptor_.getDriver<Supplier.IController>();
    }

    public getConsumer(): ConsumerChannel | null
    {
        return this.consumer_;
    }

    public toJSON(): ISupplier
    {
        let ret: ISupplier = 
        {
            uid: this.uid,
            performance: this.performance,
            free: this.free
        };
        return ret;
    }

    public toNode(): ISupplierNode
    {
        return {
            uid: this.uid,
            created_at: DateUtil.to_string(this.created_at, true),
            assigned_at: this.assigned_at_
                ? DateUtil.to_string(this.assigned_at_, true)
                : null
        };
    }

    /* ----------------------------------------------------------------
        ASSIGNER
    ---------------------------------------------------------------- */
    /**
     * @internal
     */
    public async transact(consumer: ConsumerChannel): Promise<boolean>
    {
        let ret: boolean;
        await UniqueLock.lock(this.mutex_, () =>
        {
            if ((ret = this.free) === true)
            {
                this.consumer_ = consumer;
                this.assigned_at_ = new Date();
                this.acceptor_.getProvider()!.provider = consumer.getDriver().servants[this.uid];
            }
        });
        return ret!;
    }

    /**
     * @internal
     */
    public async release(consumer: ConsumerChannel): Promise<void>
    {
        await UniqueLock.lock(this.mutex_, async () =>
        {
            if (this.consumer_ === consumer)
            {
                // ERASE CONSUMER
                this.consumer_ = null;
                this.assigned_at_ = null;
                this.acceptor_.getProvider()!.provider = null;

                // TO ANTICIPATE ABUSING
                this.getDriver().close().catch(() => {});
            }
        });
    }
}

export namespace SupplierChannel
{
    export interface IController
    {
        provider: object | null;
        getUID(): number;
    }

    export class Provider implements IController
    {
        private channel_: SupplierChannel;

        // PROVIDER FOR SUPPLIER := CONTROLLER OF CONSUMER (SERVANT)
        public provider: object | null = null;

        public constructor(channel: SupplierChannel)
        {
            this.channel_ = channel;
        }
        
        public getUID(): number
        {
            return this.channel_.uid;
        }
    }
}
