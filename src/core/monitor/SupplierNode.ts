import { ConsumerNode } from "./ConsumerNode";
import { ISupplierNode } from "./ISupplierNode";

export class SupplierNode
{
    public readonly uid: number;
    public readonly created_at: Date;

    /**
     * @hidden
     */
    private assignee_: ConsumerNode | null;

    /**
     * @hidden
     */
    private assigned_at_: Date | null;

    public constructor(raw: ISupplierNode)
    {
        this.uid = raw.uid;
        this.created_at = new Date(raw.created_at);

        this.assignee_ = null;
        this.assigned_at_ = raw.assigned_at
            ? new Date(raw.assigned_at)
            : null;
    }

    public get assignee(): ConsumerNode | null
    {
        return this.assignee_;
    }

    public get assigned_at(): Date | null
    {
        return this.assigned_at_;
    }
    
    /**
     * @internal
     */
    public assign(obj: ConsumerNode): void
    {
        this.assignee_ = obj;
        this.assigned_at_ = new Date();
    }

    /**
     * @internal
     */
    public release(): void
    {
        this.assignee_ = null;
        this.assigned_at_ = null;
    }
}