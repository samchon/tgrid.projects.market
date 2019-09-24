import { HashMap } from "tstl/container/HashMap";
import { WebServer, WebAcceptor } from "tgrid/protocols/web";
import { SharedWorkerServer, SharedWorkerAcceptor } from "tgrid/protocols/workers";
import { Driver } from "tgrid/components";

import { IConsumerNode } from "../monitor/IConsumerNode";
import { ISupplierNode } from "../monitor/ISupplierNode";
import { Monitor } from "../monitor/Monitor";

import { ConsumerChannel } from "./ConsumerChannel";
import { SupplierChannel } from "./SupplierChannel";

export class Market
{
    private server_: Server<Provider>;

    private consumers_: HashMap<number, ConsumerChannel>;
    private suppliers_: HashMap<number, SupplierChannel>;
    private monitors_: HashMap<number, Driver<Monitor.IController>>;

    private static sequence_: number = 0;

    /* ----------------------------------------------------------------
        CONSTRUCTORS
    ---------------------------------------------------------------- */
    private constructor(server: Server<Provider>)
    {
        this.server_ = server;

        this.consumers_ = new HashMap();
        this.suppliers_ = new HashMap();
        this.monitors_ = new HashMap();
    }

    public static async open(port: number): Promise<Market>
    {
        let server: WebServer<Provider> = new WebServer();
        let market: Market = new Market(server);

        await Market._Open(market, 
            server.open.bind(server, port),
            (acceptor: WebAcceptor<Provider>): Actor => 
            {
                if (acceptor.path.indexOf("/consumer") === 0)
                    return Actor.CONSUMER;
                else if (acceptor.path.indexOf("/supplier") === 0)
                    return Actor.SUPPLIER;
                else if (acceptor.path.indexOf("/monitor") === 0)
                    return Actor.MONITOR;
                else
                    return Actor.NONE;
            },
            (acceptor: WebAcceptor<Provider>) => acceptor.reject(404, "Invalid URL")
        );

        // RETURNS
        return market;
    }

    // public static async simulate(): Promise<Market>
    // {
    //     //----
    //     // NODE: IN CHILD-PROCESS, OPEN THE WEB-SERVER
    //     // WEB:  IN SHARED-WORKER, OPEN THE SHARED-WORKER-SERVER
    //     //----
    // }

    public async close(): Promise<void>
    {
        await this.server_.close();
        this.consumers_.clear();
        this.suppliers_.clear();
    }

    /* ----------------------------------------------------------------
        ACCESSORS
    ---------------------------------------------------------------- */
    public getSuppliers(): HashMap<number, SupplierChannel>
    {
        return this.suppliers_;
    }

    public getMonitors(): HashMap<number, Driver<Monitor.IController>>
    {
        return this.monitors_;
    }

    /* ----------------------------------------------------------------
        PROCEDURES
    ---------------------------------------------------------------- */
    /**
     * @hidden
     */
    private static async _Open<AcceptorT extends Acceptor<Provider>>
        (
            market: Market, 
            opener: (cb: (acceptor: AcceptorT) => Promise<void>) => Promise<void>,
            predicator: (acceptor: AcceptorT) => Actor,
            rejector: (acceptor: AcceptorT) => Promise<void>
        ): Promise<void>
    {
        await opener(async acceptor =>
        {
            //----
            // PRELIMINARIES
            //----
            // DETERMINE ACTOR
            let uid: number = ++Market.sequence_;
            let actor: Actor = predicator(acceptor);

            if (actor === Actor.NONE)
            {
                await rejector(acceptor);
                return;
            }
            else if (actor === Actor.MONITOR)
            {
                market._Handle_monitor(uid, acceptor);
                return;
            }

            // PREPARE ASSETS
            let instance: Instance;
            let dictionary: HashMap<number, Instance>;
            let monitor_inserter: (drvier: Driver<Monitor.IController>)=>Promise<void>;
            let monitor_eraser: (drvier: Driver<Monitor.IController>)=>Promise<void>;
            
            //----
            // PROCEDURES
            //----
            // CONSTRUCT INSTANCE
            if (actor === Actor.CONSUMER)
            {
                instance = await ConsumerChannel.create(uid, market, acceptor as Acceptor<ConsumerChannel.Provider>);
                dictionary = market.consumers_;

                let raw: IConsumerNode = { uid: uid, servants: [] };
                monitor_inserter = driver => driver.insertConsumer(raw);
                monitor_eraser = driver => driver.eraseConsumer(uid);
            }
            else
            {
                instance = await SupplierChannel.create(uid, acceptor as Acceptor<SupplierChannel.Provider>);
                dictionary = market.suppliers_;

                let raw: ISupplierNode = { uid: uid };
                monitor_inserter = driver => driver.insertSupplier(raw);
                monitor_eraser = driver => driver.eraseSupplier(uid);
            }
            
            // ENROLL TO DICTIONARY
            dictionary.emplace(uid, instance);
            console.log("A participant has come", market.consumers_.size(), market.suppliers_.size());
            
            // INFORM TO MONITORS
            for (let entry of market.monitors_)
                monitor_inserter(entry.second).catch(() => {});

            //----
            // DISCONNECTION
            //----
            // JOIN CONNECTION
            try { await acceptor.join(); } catch {}

            // ERASE ON DICTIONARY
            dictionary.erase(uid);
            console.log("A participant has left", market.consumers_.size(), market.suppliers_.size());
            
            // INFORM TO MONITORS
            for (let entry of market.monitors_)
                monitor_eraser(entry.second).catch(() => {});
        });
    }

    private async _Handle_monitor(uid: number, acceptor: Acceptor<{}>): Promise<void>
    {
        console.log("A monitor has come", this.monitors_.size());

        // ACCEPT CONNECTION
        let driver: Driver<Monitor.IController> = acceptor.getDriver<Monitor.IController>();
        await acceptor.accept(null);

        this.monitors_.emplace(uid, driver);

        //----
        // SEND CURRENT RELATIONSHIP
        //----
        let rawConsumers: IConsumerNode[] = [];
        let rawSuppliers: ISupplierNode[] = [];

        // CONSUMERS
        for (let entry of this.consumers_)
        {
            let raw: IConsumerNode = { uid: entry.first, servants: [] };
            for (let servantEntry of entry.second.getAssignees())
                raw.servants.push(servantEntry.first);
            rawConsumers.push(raw);
        }
        
        // SUPPLIERS
        for (let entry of this.suppliers_)
        {
            let raw: ISupplierNode = { uid: entry.first };
            rawSuppliers.push(raw);
        }
        
        // DO ASSIGN
        await driver.assign(rawConsumers, rawSuppliers);

        //----
        // JOIN CONNECTION
        //----
        await acceptor.join();
        this.monitors_.erase(uid);

        console.log("A monitor has left", this.monitors_.size());
    }
}

type Server<Provider extends object> = WebServer<Provider> | SharedWorkerServer<Provider>;
type Acceptor<Provider extends object> = WebAcceptor<Provider> | SharedWorkerAcceptor<Provider>;
type Provider = ConsumerChannel.Provider | SupplierChannel.Provider;

type Instance = ConsumerChannel | SupplierChannel;
const enum Actor
{
    NONE,
    CONSUMER,
    SUPPLIER,
    MONITOR
}