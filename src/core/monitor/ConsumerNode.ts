import { HashMap } from "tstl/container/HashMap";
import { SupplierNode } from "./SupplierNode";
import { IConsumerNode } from "./IConsumerNode";

export class ConsumerNode
{
    public readonly uid: number;
    public readonly servants: HashMap<number, SupplierNode>;
    public readonly created_at: Date;

    public constructor(raw: IConsumerNode)
    {
        this.uid = raw.uid;
        this.servants = new HashMap();
        this.created_at = new Date(raw.created_at);
    }
}