import { ConsumerNode } from "./ConsumerNode";

export class SupplierNode
{
    public readonly uid: number;

    /**
     * @hidden
     */
    private assignee_: ConsumerNode | null;

    public constructor(uid: number)
    {
        this.uid = uid;
        this.assignee_ = null;
    }

    public get assignee(): ConsumerNode | null
    {
        return this.assignee_;
    }
    
    /**
     * @internal
     */
    public assign(obj: ConsumerNode): void
    {
        this.assignee_ = obj;
    }

    /**
     * @internal
     */
    public release(): void
    {
        this.assignee_ = null;
    }
}