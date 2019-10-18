import { WebAcceptor } from "tgrid/protocols/web/WebAcceptor";
import { HashMap } from "tstl/container/HashMap";
import { ArrayDict } from "../../utils/ArrayDict";
import { DateUtil } from "../../utils/DateUtil";

import { IConsumerNode } from "../monitor/IConsumerNode";
import { ISupplier } from "../supplier/ISupplier";
import { SupplierChannel } from "./SupplierChannel";

import { Market } from "./Market";
import { Supplier } from "../supplier/Supplier";
import { Consumer } from "../consumer/Consumer";

export class ConsumerChannel
{
    public readonly uid: number;
    public readonly created_at: Date;

    /**
     * @hidden
     */
    private market_: Market;

    /**
     * @hidden
     */
    private acceptor_: WebAcceptor<ConsumerChannel.Provider>;

    /**
     * @hidden
     */
    private servants_: HashMap<number, SupplierChannel>;

    /* ----------------------------------------------------------------
        CONSTRUCTORS
    ---------------------------------------------------------------- */
    /**
     * @hidden
     */
    private constructor(uid: number, market: Market, acceptor: WebAcceptor<ConsumerChannel.Provider>)
    {
        this.uid = uid;
        this.market_ = market;
        this.acceptor_ = acceptor;
        
        this.created_at = new Date();
        this.servants_ = new HashMap();
    }

    /**
     * @internal
     */
    public static async create(uid: number, market: Market, acceptor: WebAcceptor<ConsumerChannel.Provider>): Promise<ConsumerChannel>
    {
        let ret: ConsumerChannel = new ConsumerChannel(uid, market, acceptor);
        await ret.acceptor_.accept(new ConsumerChannel.Provider(ret));
        
        ret._Handle_disconnection();
        return ret;
    }

    /**
     * @hidden
     */
    private async _Handle_disconnection(): Promise<void>
    {
        try { await this.acceptor_.join(); } catch {}
        for (let it of this.servants_)
            await it.second.release(this);
    }

    /* ----------------------------------------------------------------
        ACCESSORS
    ---------------------------------------------------------------- */
    /**
     * @internal
     */
    public getMarket(): Market
    {
        return this.market_;
    }

    public getDriver()
    {
        return this.acceptor_.getDriver<Consumer.IController>();
    }

    /**
     * @internal
     */
    public getAssignees()
    {
        return this.servants_;
    }

    public toNode(): IConsumerNode
    {
        return {
            uid: this.uid,
            created_at: DateUtil.to_string(this.created_at, true),
            servants: [...this.servants_].map(it => it.first)
        };
    }

    /* ----------------------------------------------------------------
        SUPPLIERS I/O
    ---------------------------------------------------------------- */
    /**
     * @internal
     */
    public async transact(supplier: SupplierChannel): Promise<boolean>
    {
        if (this.servants_.has(supplier.uid) || // DUPLICATED
            await supplier.transact(this) === false) // MONOPOLIZED
            return false;

        // CONSTR5UCT SERVANT
        await this.servants_.emplace(supplier.uid, supplier);

        // PROVIDER FOR CONSUMER (SERVANT) := CONTROLLER OF SUPPLIER
        let provider = supplier.getDriver();
        this.acceptor_.getProvider()!.assginees.set(supplier.uid, provider);

        // RETURN WITH ASSIGNMENT
        await provider.assign(this.uid);
        for (let entry of this.market_.getMonitors())
            entry.second.transact(this.uid, supplier.uid).catch(() => {});

        return true;
    }

    /**
     * @internal
     */
    public async release(supplier: SupplierChannel): Promise<void>
    {
        this.servants_.erase(supplier.uid);
        this.acceptor_.getProvider()!.assginees.erase(supplier.uid);

        await supplier.release(this);
        for (let entry of this.market_.getMonitors())
            entry.second.release(supplier.uid).catch(() => {});
    }
}

export namespace ConsumerChannel
{
    /**
     * @hidden
     */
    export interface IController
    {
        assginees: ArrayLike<Supplier.IController>;
    
        getUID(): number;
        getSuppliers(): ISupplier[];
        buyResource(supplier: ISupplier): Promise<boolean>;
    }

    /**
     * @hidden
     */
    export class Provider implements IController
    {
        private consumer_: ConsumerChannel;
        private market_: Market;
        public assginees: ArrayDict<Supplier.IController>;

        public constructor(consumer: ConsumerChannel)
        {
            this.consumer_ = consumer;
            this.market_ = consumer.getMarket();
            this.assginees = new ArrayDict();
        }

        public getUID(): number
        {
            return this.consumer_.uid;
        }

        public getSuppliers(): ISupplier[]
        {
            return this.market_.getSuppliers().toJSON().map(entry => entry.second.toJSON());
        }

        public async buyResource(supplier: ISupplier): Promise<boolean>
        {
            let map = this.market_.getSuppliers();
            let it = map.find(supplier.uid);

            if (it.equals(map.end()) === true)
                return false;

            return await this.consumer_.transact(it.second);
        }
    }
}
