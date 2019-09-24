import { HashMap } from "tstl/container/HashMap";
import { SupplierNode } from "./SupplierNode";

export class ConsumerNode
{
    public readonly uid: number;
    public readonly servants: HashMap<number, SupplierNode>;

    public constructor(uid: number)
    {
        this.uid = uid;
        this.servants = new HashMap();
    }
}