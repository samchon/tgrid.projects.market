import { HashMap } from "tstl/container/HashMap";
import { WebServer } from "tgrid/protocols/web/WebServer";
import { WebAcceptor } from "tgrid/protocols/web/WebAcceptor";
import { Driver } from "tgrid/components/Driver";

import { ConsumerChannel } from "./ConsumerChannel";
import { SupplierChannel } from "./SupplierChannel";
import { Monitor } from "../monitor/Monitor";

export class Market
{
    private server_: WebServer<Provider>;

    private consumers_: HashMap<number, ConsumerChannel>;
    private suppliers_: HashMap<number, SupplierChannel>;
    private monitors_: HashMap<number, Driver<Monitor.IController>>;

    private static sequence_: number = 0;

    /* ----------------------------------------------------------------
        CONSTRUCTORS
    ---------------------------------------------------------------- */
    /**
     * Default Constructor.
     */
    public constructor()
    {
        this.server_ = new WebServer<Provider>();

        this.consumers_ = new HashMap();
        this.suppliers_ = new HashMap();
        this.monitors_ = new HashMap();
    }

    public open(port: number): Promise<void>
    {
        return this.server_.open(port, async (acceptor: WebAcceptor<Provider>) =>
        {
            let uid: number = ++Market.sequence_;
            if (acceptor.path === "/monitor")
            {
                await this._Handle_monitor(uid, acceptor);
                return;
            }

            //----
            // PRELIMINARIES
            //----
            // DETERMINE ACTOR
            let instance: Instance;
            let dictionary: HashMap<number, Instance>;

            // MONITOR HANDLER
            let monitor_inserter: (drvier: Driver<Monitor.IController>) => Promise<void>;
            let monitor_eraser: (drvier: Driver<Monitor.IController>) => Promise<void>;

            // PARSE PATH
            if (acceptor.path === "/consumer")
            {
                instance = await ConsumerChannel.create(uid, this, acceptor as WebAcceptor<ConsumerChannel.Provider>);
                dictionary = this.consumers_;

                monitor_inserter = driver => driver.insertConsumer((instance as ConsumerChannel).toNode());
                monitor_eraser = driver => driver.eraseConsumer(uid);
            }
            else if (acceptor.path === "/supplier")
            {
                instance = await SupplierChannel.create(uid, acceptor as WebAcceptor<SupplierChannel.Provider>);
                dictionary = this.suppliers_;

                monitor_inserter = driver => driver.insertSupplier((instance as SupplierChannel).toNode());
                monitor_eraser = driver => driver.eraseSupplier(uid);
            }
            else
            {
                acceptor.reject(404, "Invalid URL");
                return;
            }

            //----
            // PROCEDURES
            //----
            // ENROLL TO DICTIONARY
            dictionary.emplace(uid, instance);
            console.log("A participant has come", this.consumers_.size(), this.suppliers_.size());
            
            // INFORM TO MONITORS
            for (let entry of this.monitors_)
                monitor_inserter(entry.second).catch(() => {});

            //----
            // DISCONNECTION
            //----
            // JOIN CONNECTION
            try 
            { 
                await acceptor.join(); 
            } 
            catch {}

            // ERASE ON DICTIONARY
            dictionary.erase(uid);
            console.log("A participant has left", this.consumers_.size(), this.suppliers_.size());
            
            // INFORM TO MONITORS
            for (let entry of this.monitors_)
                monitor_eraser(entry.second).catch(() => {});
        });
    }

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
        MONITOR HANDLER
    ---------------------------------------------------------------- */
    /**
     * @hidden
     */
    private async _Handle_monitor(uid: number, acceptor: WebAcceptor<{}>): Promise<void>
    {
        console.log("A monitor has come", this.monitors_.size());

        // ACCEPT CONNECTION
        let driver: Driver<Monitor.IController> = acceptor.getDriver<Monitor.IController>();
        await acceptor.accept(null);

        this.monitors_.emplace(uid, driver);

        //----
        // SEND CURRENT RELATIONSHIP
        //----
        // DO ASSIGN
        await driver.assign
        (
            [...this.consumers_].map(it => it.second.toNode()), 
            [...this.suppliers_].map(it => it.second.toNode())
        );

        //----
        // JOIN CONNECTION
        //----
        await acceptor.join();
        this.monitors_.erase(uid);

        console.log("A monitor has left", this.monitors_.size());
    }
}

type Provider = ConsumerChannel.Provider | SupplierChannel.Provider;
type Instance = ConsumerChannel | SupplierChannel;