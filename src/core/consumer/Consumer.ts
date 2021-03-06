import { WebConnector } from "tgrid/protocols/web/WebConnector";
import { Driver } from "tgrid/components/Driver";
import { ArrayDict } from "../../utils/ArrayDict";

import { ISupplier } from "../supplier/ISupplier";
import { Servant } from "./Servant";
import { ConsumerChannel } from "../market/ConsumerChannel";
import { Supplier } from "../supplier/Supplier";

export class Consumer
{
    public readonly uid: number;
    private connector_: WebConnector<Consumer.Provider>;

    private market_: Driver<ConsumerChannel.IController>;
    private servants_: Servant[];

    /* ----------------------------------------------------------------
        CONSTRUCTORS
    ---------------------------------------------------------------- */
    private constructor(uid: number, connector: WebConnector<Consumer.Provider>)
    {
        this.uid = uid;
        this.connector_ = connector;

        this.market_ = connector.getDriver<ConsumerChannel.IController>();
        this.servants_ = [];
    }

    public static async participate(url: string): Promise<Consumer>
    {
        let provider: Consumer.Provider = new Consumer.Provider();
        let connector: WebConnector<Consumer.Provider> = new WebConnector(provider);
        await connector.connect(url);

        let uid: number = await connector.getDriver<ConsumerChannel.IController>().getUID();
        return new Consumer(uid, connector);
    }

    public leave(): Promise<void>
    {
        return this.connector_.close();
    }

    /* ----------------------------------------------------------------
        ACCESSORS
    ---------------------------------------------------------------- */
    public getSuppliers(): Promise<ISupplier[]>
    {
        return this.market_.getSuppliers();
    }

    public async buyResource(base: ISupplier): Promise<Servant | null>
    {
        if (await this.market_.buyResource(base) === false)
            return null;

        let driver: Supplier.IController = this.market_.assginees[base.uid];
        let ret: Servant = Servant.create(base, driver as Driver<Supplier.IController>);

        ret.join().then(() =>
        {
            for (let i: number = 0; i < this.servants_.length; ++i)
                if (this.servants_[i].uid === ret.uid)
                {
                    this.servants_.splice(i, 1);
                    break;
                }
            this.connector_.getProvider()!.servants.erase(ret.uid);
        });

        this.servants_.push(ret);
        this.connector_.getProvider()!.servants.set(ret.uid, new Servant.Provider(ret));
        
        return ret;
    }
}

export namespace Consumer
{
    /**
     * @internal
     */
    export interface IController
    {
        servants: ArrayLike<Servant.IController>;
    }

    /**
     * @internal
     */
    export class Provider implements IController
    {
        public servants: ArrayDict<Servant.Provider> = new ArrayDict();
    }
}