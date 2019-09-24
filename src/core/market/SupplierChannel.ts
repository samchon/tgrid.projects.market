import { WebAcceptor } from "tgrid/protocols/web";
import { SharedWorkerAcceptor } from "tgrid/protocols/workers";
import { Mutex } from "tstl/thread/Mutex";

import { ISupplier } from "../supplier/ISupplier";
import { IPerformance } from "../supplier/IPerformance";
import { ConsumerChannel } from "./ConsumerChannel";
import { UniqueLock } from "tstl/thread/UniqueLock";
import { Driver } from "tgrid/components/Driver";
import { Supplier } from "../supplier/Supplier";

export class SupplierChannel implements Readonly<ISupplier>
{
    /**
     * @inheritDoc
     */
    public readonly uid: number;

    /**
     * @inheritDoc
     */
    public readonly performance: IPerformance;

    /**
     * @hidden
     */
    private acceptor_: Acceptor;

    /**
     * @hidden
     */
    private consumer_: ConsumerChannel | null;

    /**
     * @hidden
     */
    private mtx_: Mutex;

    /* ----------------------------------------------------------------
        CONSTRUCTORS
    ---------------------------------------------------------------- */
    /**
     * @hidden
     */
    private constructor(uid: number, acceptor: Acceptor)
    {
        this.uid = uid;
        this.acceptor_ = acceptor;
        
        this.performance = 
        {
            mean: 1.0,
            risk: 0.0,
            credit: 0.0
        };
        this.consumer_ = null;
        this.mtx_ = new Mutex();
    }

    /**
     * @internal
     */
    public static async create(uid: number, acceptor: Acceptor): Promise<SupplierChannel>
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
        await UniqueLock.lock(this.mtx_, async () =>
        {
            if (this.consumer_ !== null)
                this.consumer_.unlink(this);
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

    /* ----------------------------------------------------------------
        ASSIGNER
    ---------------------------------------------------------------- */
    /**
     * @internal
     */
    public async link(consumer: ConsumerChannel): Promise<boolean>
    {
        let ret: boolean;
        await UniqueLock.lock(this.mtx_, () =>
        {
            if ((ret = this.free) === true)
            {
                this.consumer_ = consumer;
                this.acceptor_.getProvider()!.provider = consumer.getDriver().servants[this.uid];
            }
        });
        return ret!;
    }

    /**
     * @internal
     */
    public async unlink(consumer: ConsumerChannel): Promise<void>
    {
        await UniqueLock.lock(this.mtx_, async () =>
        {
            if (this.consumer_ === consumer)
            {
                // ERASE CONSUMER
                this.consumer_ = null;
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

/**
 * @hidden
 */
type Acceptor = WebAcceptor<SupplierChannel.Provider> | SharedWorkerAcceptor<SupplierChannel.Provider>;